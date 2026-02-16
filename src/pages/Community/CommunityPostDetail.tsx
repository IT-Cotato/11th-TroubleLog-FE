import TagList from "@/entities/trouble/ui/TagList";
import PostComment from "@/entities/trouble/ui/PostComment";
import PostGuideMd from "@/entities/trouble/ui/PostGuideMd";
import KebabDropdown from "@/shared/ui/Menu/KebabDropdown";
import KebabMenuButton from "@/shared/ui/Menu/KebabMenuButton";
import ReportModal from "@/shared/ui/Modal/ReportModal";
import { PATH } from "@/shared/config/paths";
import useClickOutside from "@/hooks/useClickOutside";
import { useDetailContext } from "@/hooks/useDetailContext";
import {
  buildFreeformPrefill,
  buildTemplatePrefill,
} from "@/shared/utils/prefillBuilder";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import imageIcon from "@/assets/icons/image.svg";
import starIcon from "@/assets/icons/star.svg";
import heartIcon from "@/assets/icons/heart.svg";
import likeEmptyIcon from "@/assets/icons/like_empty.svg";
import shareIcon from "@/assets/icons/share.svg";
import { likeCommunityPost } from "@/api/community.api";
import { getPostDetail, hardDeletePost } from "@/api/post.api";
import { postFollow, postUnfollow } from "@/api/user.api";
import { extractIdFromSlug, makePostSlug } from "@/shared/lib/slug";
import { usePostDetail } from "./hooks/usePostDetail";
import { usePostComments } from "./hooks/usePostComments";

export type { CommunityPostDetailProps } from "./types";

export default function CommunityPostDetail() {
  const HEADER_OFFSET = 100;

  // 고정 폭(상단 콘텐츠/본문 공통)
  const CONTENT_WIDTH_CLASS =
    "w-full sm:w-[520px] md:w-[680px] lg:w-[820px] xl:w-[960px]";

  const { postId, slug } = useParams<{ postId?: string; slug?: string }>();
  const navigate = useNavigate();

  const effectiveId = useMemo(() => {
    if (postId && Number.isFinite(Number(postId))) return Number(postId);
    if (slug) return extractIdFromSlug(slug);
    return NaN;
  }, [postId, slug]);

  const detailCtx = useDetailContext();
  const resumePromptShownRef = useRef<Record<number, boolean>>({});
  const onLoadStartRef = useRef<() => void>(() => {});
  const onCommunityLoadedRef = useRef<(postId: number, viewerId: number | null) => void>(() => {});

  const {
    post,
    setPost,
    loading,
    loadError,
    isCommunitySource,
    isLiked,
    likeCounts,
    setIsLiked,
    setLikeCounts,
  } = usePostDetail(effectiveId, detailCtx, navigate, {
    onLoadStart: useCallback(() => {
      onLoadStartRef.current();
    }, []),
    onCommunityLoaded: useCallback((id: number, viewerId: number | null) => {
      onCommunityLoadedRef.current(id, viewerId);
    }, []),
    resumePromptShownRef,
  });

  const commentsApi = usePostComments({
    effectiveId,
    isCommunitySource,
    viewerId: detailCtx.viewerId ?? null,
    setPost,
  });

  onLoadStartRef.current = () => commentsApi.resetForNewPost();
  onCommunityLoadedRef.current = (id: number, viewerId: number | null) => {
    commentsApi.loadComments(id, 1, viewerId);
  };

  const {
    commentInput,
    setCommentInput,
    comments,
    isCommentPosting,
    cPage,
    cHasNext,
    cLoading,
    loadComments,
    handleSubmitComment,
    handleReply,
    handleEdit,
    handleDelete,
  } = commentsApi;

  const [isLiking, setIsLiking] = useState(false);
  const likeLockRef = useRef(false);

  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<
    | { type: "post"; postId: number }
    | { type: "comment"; commentId: string }
    | null
  >(null);
  const closeMenu = useCallback(() => setShowMenu(false), []);
  const menuRef = useClickOutside(() => setShowMenu(false));

  const [currentSection, setCurrentSection] = useState<number>(0);
  const contentColRef = useRef<HTMLDivElement | null>(null);
  const [asideOffset, setAsideOffset] = useState(0);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const updateAsideOffset = () => {
      const first = sectionRefs.current[0];
      const col = contentColRef.current;
      if (!first || !col) {
        setAsideOffset(0);
        return;
      }
      const firstTop = first.getBoundingClientRect().top + window.scrollY;
      const colTop = col.getBoundingClientRect().top + window.scrollY;
      const gap = Math.max(0, Math.round(firstTop - colTop));
      setAsideOffset(gap);
    };

    // 초기에 한 번, 레이아웃 안정화 직후 한 번
    requestAnimationFrame(updateAsideOffset);

    // 리사이즈/폰트/이미지 로딩 등 레이아웃 변화에 대응
    const onResize = () => updateAsideOffset();
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);

    // 본문 컬럼 변화를 관찰(높이/폭 변동)
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && contentColRef.current) {
      ro = new ResizeObserver(updateAsideOffset);
      ro.observe(contentColRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
      ro?.disconnect();
    };
  }, [post]); // post가 로드된 뒤에 계산

  // 공유 토스트
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }
  };

  const showToast = (message: string) => {
    setToast({ open: true, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast({ open: false, message: "" });
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      const ok = await copyToClipboard(url);
      showToast(
        ok
          ? "링크가 복사되었어요!"
          : "복사에 실패했어요. 주소창에서 복사해주세요.",
      );
    } catch {
      showToast("복사에 실패했어요. 주소창에서 복사해주세요.");
    }
  };

  useEffect(() => {
    if (!post) return;

    // 비공개/내 글(/troubles 기반)일 때는 slug 정규화 X
    if (!isCommunitySource) return;

    const canonical =
      PATH.COMMUNITY_POST_SLUG(
        makePostSlug(post.title, postId ?? effectiveId),
      ) + window.location.search;

    if (!slug || slug !== makePostSlug(post.title, effectiveId)) {
      navigate(canonical, { replace: true });
    }
  }, [post, slug, effectiveId, navigate, postId, isCommunitySource]);

  const navigatingRef = useRef(false);

  const goEditWithPrefill = useCallback(async () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;

    closeMenu();

    try {
      const pid = effectiveId;
      if (!Number.isFinite(pid)) return;

      const myDetail = await getPostDetail(pid);
      const tt = String((myDetail as any)?.templateType ?? "").toUpperCase();
      const isFreeform = tt === "FREE_FORM" || tt === "FREEFORM";
      const editorPath = isFreeform ? PATH.FREEFORM_WRITING : PATH.TEMP_WRITING;
      const prefill = isFreeform
        ? buildFreeformPrefill(myDetail)
        : buildTemplatePrefill(myDetail);

      // 같은 페인트 사이클에서의 상태 폭주 방지
      queueMicrotask(() => {
        navigate(editorPath, {
          replace: true,
          state: {
            ...prefill,
            postId: pid,
            mode: "edit",
            from: "community-detail",
          },
        });
      });
    } catch (err) {
      console.error(err);
      alert(
        "수정 화면으로 이동하기 위한 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
      );
      navigatingRef.current = false; // 실패 시에만 잠금 해제
    }
  }, [postId, navigate, closeMenu]);

  // 작성자 프로필 클릭
  const handleProfileClick = () => {
    if (!post || post.authorId == null) return;
    navigate(PATH.MYPAGE_ID(String(post.authorId)));
  };

  // 좋아요 토글(커뮤니티 글에서만)
  const handleToggleLike = async () => {
    if (!Number.isFinite(effectiveId)) return;
    if (!isCommunitySource) {
      alert("작성 중/비공개 문서는 좋아요를 사용할 수 없어요.");
      return;
    }
    if (likeLockRef.current) return;
    likeLockRef.current = true;
    setIsLiking(true);

    const pid = effectiveId;
    const wasLiked = isLiked;
    const prevCount = likeCounts;

    if (wasLiked) {
      setIsLiked(false);
      setLikeCounts(Math.max(0, prevCount - 1));
      try {
        await likeCommunityPost(pid);
      } catch {
        setIsLiked(true);
        setLikeCounts(prevCount);
      } finally {
        likeLockRef.current = false;
        setIsLiking(false);
      }
    } else {
      setIsLiked(true);
      setLikeCounts(prevCount + 1);
      try {
        const res = await likeCommunityPost(pid);
        setLikeCounts(res?.likeCount ?? prevCount + 1);
      } catch (err: any) {
        const status = err?.response?.status ?? err?.status;
        if (status === 409) {
          setIsLiked(true);
          setLikeCounts(prevCount);
        } else {
          setIsLiked(false);
          setLikeCounts(prevCount);
        }
      } finally {
        likeLockRef.current = false;
        setIsLiking(false);
      }
    }
  };

  // 포스트 삭제
  const handleDeletePost = useCallback(async () => {
    if (!Number.isFinite(effectiveId)) return;
    if (
      !window.confirm(
        "이 문서를 영구적으로 삭제할까요? 삭제 후에는 복구할 수 없습니다.",
      )
    )
      return;

    try {
      setDeleting(true);
      await hardDeletePost(effectiveId);
      alert("문서가 영구 삭제되었습니다.");

      if (detailCtx.from === "community") {
        navigate(PATH.COMMUNITY, { replace: true });
      } else {
        navigate(-1);
      }
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ??
          "삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  }, [postId, navigate, detailCtx.from]);

  // 스크롤 감시
  useEffect(() => {
    const updateCurrentSection = () => {
      // 화면의 현재 스크롤 위치에 오프셋을 더해 기준점을 맞춤
      const y = window.scrollY + HEADER_OFFSET + 1;
      let cur = 0;

      sectionRefs.current.forEach((ref, idx) => {
        if (!ref) return;
        const top = ref.getBoundingClientRect().top + window.scrollY;
        if (y >= top) cur = idx;
      });

      setCurrentSection(cur);
    };

    window.addEventListener("scroll", updateCurrentSection, { passive: true });
    updateCurrentSection();

    return () => window.removeEventListener("scroll", updateCurrentSection);
  }, []);

  const scrollToSection = (idx: number) => {
    const target = sectionRefs.current[idx];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 팔로우
  const handleFollow = async () => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            isFollowed: true,
            authorFollowers: (prev.authorFollowers ?? 0) + 1,
          }
        : prev,
    );

    try {
      await postFollow(Number(post?.authorId));
    } catch (e) {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              isFollowed: false,
              authorFollowers: Math.max(0, (prev.authorFollowers ?? 1) - 1),
            }
          : prev,
      );
      console.error("팔로우 실패", e);
    }
  };

  // 언팔로우
  const handleUnfollow = async () => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            isFollowed: false,
            authorFollowers: Math.max(0, (prev.authorFollowers ?? 1) - 1),
          }
        : prev,
    );

    try {
      await postUnfollow(Number(post?.authorId));
    } catch (e) {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              isFollowed: true,
              authorFollowers: (prev.authorFollowers ?? 0) + 1,
            }
          : prev,
      );
      console.error("언팔로우 실패", e);
    }
  };

  // 로딩/에러 처리
  if (loading) {
    return (
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 2xl:px-40">
        <div className="mx-auto flex justify-center">
          <div
            className={`${CONTENT_WIDTH_CLASS} flex flex-col gap-6 sm:gap-[24px] pt-24 sm:pt-[180px]`}
          >
            <div className="w-full h-[120px] bg-gray-100 rounded" />
            <div className="w-full h-[400px] bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // CTA 핸들러들
  const viewerIdForCta = detailCtx.viewerId;
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(PATH.COMMUNITY, { replace: true });
  };
  const goCommunity = () => navigate(PATH.COMMUNITY, { replace: true });
  const goHome = () => navigate(PATH.HOME, { replace: true });
  const goLogin = () => {
    const sp = new URLSearchParams();
    sp.set("next", window.location.pathname + window.location.search);
    navigate(`${PATH.ROOT}?${sp.toString()}`, { replace: true });
  };
  const goMyPage = () => {
    if (viewerIdForCta != null) navigate(PATH.MYPAGE_BASE);
    else goLogin();
  };

  const err = loadError;

  // 1) 400 BAD_REQUEST이면 카드 UI
  if (err && err.status === 400) {
    return (
      <section className="w-full flex items-center justify-center py-24 px-6">
        <section className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-10 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100">
              <span className="text-4xl" aria-hidden>
                ⚠️
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-head-32-semibold">요청을 처리할 수 없어요</h1>
              <p className="text-body-16-regular text-gray-500">
                {err.message}
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={goBack}
                className="px-4 h-11 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                이전 페이지
              </button>
              <button
                onClick={goCommunity}
                className="px-4 h-11 rounded-lg bg-primary text-white hover:opacity-90 transition"
              >
                커뮤니티 홈
              </button>
              <button
                onClick={goHome}
                className="px-4 h-11 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                홈으로 가기
              </button>
              <button
                onClick={goMyPage}
                className="px-4 h-11 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                {viewerIdForCta != null ? "내 마이페이지" : "로그인하기"}
              </button>
            </div>
          </div>
        </section>
      </section>
    );
  }

  // 2) 그 외 에러/데이터 없음은 기존 단순 뷰 유지
  if (!post || err) {
    return (
      <div className="w-full px-4 sm:px-6 md:px-8">
        <div className="mx-auto flex justify-center">
          <div
            className={`${CONTENT_WIDTH_CLASS} pt-24 sm:pt-[180px] text-red-600`}
          >
            {err ? err.message : "포스트를 찾을 수 없습니다."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8">
      {/* 전체(본문+TOC) 그룹을 가로 중앙 정렬 */}
      <div className="mx-auto max-w-[1280px] flex items-start justify-center gap-6">
        {/* 본문 컬럼: 상단/본문/댓글이 모두 동일한 고정 폭을 사용 */}
        <div
          ref={contentColRef}
          className={`${CONTENT_WIDTH_CLASS} flex flex-col items-start gap-8 sm:gap-[56px] mb-24 sm:mb-[224px]`}
        >
          {/* 상단 영역 */}
          <div className="flex w-full pt-20 sm:pt-[180px] pb-[18px] items-center border-b border-gray1">
            <div className="flex flex-col items-start gap-8 sm:gap-[44px] w-full">
              <div className="flex flex-col items-start gap-8 sm:gap-[53px] w-full">
                <div className="flex flex-col items-start gap-[10px] w-full">
                  {/* 에러 종류 & (케밥 버튼) */}
                  <div className="flex w-full justify-between items-start gap-2">
                    <span className="text-head-20-semibold">
                      {post.errorType}
                    </span>
                    <div className="relative shrink-0" ref={menuRef}>
                      <KebabMenuButton onClick={() => setShowMenu(!showMenu)} />
                      {showMenu && (
                        <KebabDropdown
                          options={
                            post.isMine
                              ? [
                                  {
                                    label: "포스트 수정",
                                    onClick: () => void goEditWithPrefill(),
                                  },
                                  {
                                    label: deleting ? "삭제 중..." : "삭제",
                                    onClick: () =>
                                      !deleting && handleDeletePost(),
                                  },
                                ]
                              : [
                                  {
                                    label: "신고하기",
                                    onClick: () => {
                                      setShowMenu(false);
                                      setReportTarget({
                                        type: "post",
                                        postId: effectiveId,
                                      });
                                      setReportModalOpen(true);
                                    },
                                  },
                                ]
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* 포스트 제목 */}
                  <div className="text-head-48 break-words">{post.title}</div>
                </div>

                {/* 태그 & 작성일 */}
                <div className="flex flex-wrap items-center gap-[12px] sm:gap-[16px]">
                  <TagList tags={post.tags} variant="post" />
                  <div className="text-body-16-regular text-gray3">·</div>
                  <div className="text-body-20-regular text-gray3">
                    {post.date}
                  </div>
                </div>
              </div>

              {/* 작성자 정보 & 중요도 */}
              <div className="flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div
                  className="flex items-center gap-[14px] sm:gap-[20px] cursor-pointer"
                  onClick={() =>
                    navigate(PATH.MYPAGE_ID(String(post.authorId)))
                  }
                >
                  <img
                    src={post.authorProfile || imageIcon}
                    onError={(e) => (e.currentTarget.src = imageIcon)}
                    alt="profile"
                    className="w-12 h-12 sm:w-[66px] sm:h-[66px] rounded-full object-cover"
                  />
                  <div className="text-head-24-bold">{post.authorName}</div>
                </div>

                {post.isMine && post.importance !== 0 && (
                  <div className="flex items-center gap-[8px]">
                    <img
                      src={starIcon}
                      alt="importance"
                      className="w-5 h-5 sm:w-[24px] sm:h-[24px]"
                    />
                    <div className="text-body-20-regular text-gray3">
                      {post.importance}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 하단 영역 */}
          <div className="flex w-full flex-col items-start gap-[8px]">
            {/* 메인 */}
            <div className="flex flex-col items-start gap-[36px] self-stretch">
              {/* 포스트 내용 */}
              <div className="flex flex-col items-start gap-[48px] self-stretch">
                {post.questions.map((q, idx) => (
                  <div
                    id={`section-${idx}`}
                    key={idx}
                    ref={(el) => {
                      sectionRefs.current[idx] = el;
                    }}
                    style={{ scrollMarginTop: HEADER_OFFSET + 1 }}
                    className="scroll-mt-28 md:scroll-mt-[520px]"
                  >
                    <PostGuideMd
                      question={q}
                      content={post.contents[idx]}
                      widthClass={CONTENT_WIDTH_CLASS}
                    />
                  </div>
                ))}

                {/* 작성자 정보 카드 */}
                <div className="flex py-[24px] sm:py-[32px] px-5 sm:px-[40px] flex-col items-start gap-[10px] self-stretch rounded-[24px] sm:rounded-[36px] bg-[#F2F2F2]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center self-stretch gap-4">
                    <div
                      className="flex items-center gap-4 sm:gap-[28px] cursor-pointer"
                      onClick={handleProfileClick}
                    >
                      <img
                        src={post.authorProfile || imageIcon}
                        onError={(e) => (e.currentTarget.src = imageIcon)}
                        alt="profile"
                        className="w-20 h-20 sm:w-[131px] sm:h-[131px] rounded-full object-cover"
                      />
                      <div className="flex flex-col items-start gap-[10px] sm:gap-[13px]">
                        <div className="flex flex-col items-start gap-[2px]">
                          <div className="text-head-24-bold">
                            {post.authorName}
                          </div>
                          <div className="text-body-16-regular">
                            {post.authorFollowers} 팔로워
                          </div>
                        </div>
                        <div className="text-body-20-regular">
                          {post.authorBio}
                        </div>
                      </div>
                    </div>

                    {!post.isMine &&
                      (post.isFollowed ? (
                        <button
                          onClick={() => handleUnfollow()}
                          className="flex py-3 sm:py-[18px] px-6 sm:pl-[41px] sm:pr-[40px] justify-center items-center rounded-[100px] bg-subColor1 text-head-20-semibold text-white"
                        >
                          팔로잉
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFollow()}
                          className="flex py-3 sm:py-[18px] px-6 sm:pl-[41px] sm:pr-[40px] justify-center items-center rounded-[100px] bg-primary text-head-20-semibold text-white"
                        >
                          팔로우
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* 좋아요/공유 */}
              {isCommunitySource && (
                <div className="flex pt-8 sm:pt-[52px] pb-5 sm:pb-[20px] items-center self-stretch border-b border-gray1">
                  <div className="flex items-center gap-4 sm:gap-[20px]">
                    <button
                      type="button"
                      aria-pressed={isLiked}
                      aria-busy={isLiking}
                      disabled={isLiking}
                      onClick={handleToggleLike}
                      className={`flex items-center gap-2 sm:gap-[8px] ${
                        isLiking
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <img
                        src={isLiked ? heartIcon : likeEmptyIcon}
                        alt="like"
                        className="w-8 h-8 sm:w-10 sm:h-10"
                      />
                      <div className="text-body-20-regular text-gray3">
                        {likeCounts}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="cursor-pointer"
                      aria-label="현재 페이지 링크 복사"
                    >
                      <img
                        src={shareIcon}
                        alt="share"
                        className="w-8 h-8 sm:w-10 sm:h-10"
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* 댓글 작성 */}
              {isCommunitySource && (
                <div className="flex flex-col items-end gap-[12px] self-stretch">
                  <div className="flex flex-col items-start gap-6 sm:gap-[36px] self-stretch">
                    <div className="text-head-32-semibold">
                      {post.commentCounts}개의 댓글
                    </div>
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="댓글을 작성해주세요."
                      className="flex p-4 sm:pt-[28px] sm:pl-[32px] pb-24 sm:pb-[130px] w-full resize-none rounded-[24px] bg-white shadow-card text-body-20-regular text-[#757575] focus:outline-none"
                    />
                  </div>

                  <button
                    disabled={!commentInput.trim() || isCommentPosting}
                    onClick={handleSubmitComment}
                    className={`inline-flex items-center justify-center rounded-[100px] px-6 sm:px-8
              py-2 sm:py-3 text-white transition-colors
              ${
                commentInput.trim() && !isCommentPosting
                  ? "bg-primary"
                  : "bg-subColor1"
              }`}
                  >
                    <span className="text-head-20-semibold leading-none">
                      {isCommentPosting ? "작성 중…" : "작성하기"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 댓글 목록 */}
            {isCommunitySource && (
              <div className="flex flex-col items-end self-stretch">
                {comments
                  .filter((c) => !c.isReply)
                  .map((parent) => (
                    <div key={parent.id} className="w-full">
                      <PostComment
                        {...parent}
                        onEdit={(newContent) =>
                          handleEdit(parent.id, newContent)
                        }
                        onDelete={() => handleDelete(parent.id)}
                        onReply={(replyContent) =>
                          handleReply(parent.id, replyContent)
                        }
                        onReport={(commentId) => {
                          setReportTarget({
                            type: "comment",
                            commentId,
                          });
                          setReportModalOpen(true);
                        }}
                      />
                      {comments
                        .filter((c) => c.parentId === parent.id)
                        .map((reply) => (
                          <PostComment
                            key={reply.id}
                            {...reply}
                            onEdit={(newContent) =>
                              handleEdit(reply.id, newContent)
                            }
                            onDelete={() => handleDelete(reply.id)}
                            onReport={(commentId) => {
                              setReportTarget({
                                type: "comment",
                                commentId,
                              });
                              setReportModalOpen(true);
                            }}
                          />
                        ))}
                    </div>
                  ))}

                {cHasNext && Number.isFinite(effectiveId) && (
                  <button
                    disabled={cLoading}
                    onClick={() =>
                      loadComments(
                        effectiveId,
                        cPage,
                        detailCtx.viewerId ?? null,
                      )
                    }
                    className={`mt-4 px-6 py-2 rounded-full text-white ${
                      cLoading ? "bg-gray-300" : "bg-primary"
                    }`}
                  >
                    {cLoading ? "불러오는 중…" : "댓글 더 보기"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 목차(TOC): 큰 화면에서만 보이되, 본문과 함께 중앙 정렬 그룹에 포함 */}
        <aside
          className="hidden xl:block h-fit w-[220px] 2xl:w-[280px] sticky"
          style={{ top: HEADER_OFFSET, marginTop: asideOffset }}
        >
          <div className="flex flex-col items-start gap-[16px] border-l border-gray3 pl-[12px] pr-[8px] text-body-20-regular text-gray3 w-full">
            {post.questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => scrollToSection(idx)}
                className={`text-left ${
                  currentSection === idx ? "text-black" : ""
                }`}
              >
                {idx + 1}. {q}
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* 공유 토스트 */}
      {toast.open && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black text-white text-body-16-regular shadow-card z-50"
        >
          {toast.message}
        </div>
      )}

      {/* 신고 모달 */}
      {reportModalOpen && (
        <ReportModal
          onClose={() => {
            setReportModalOpen(false);
            setReportTarget(null);
          }}
          onSubmit={(reason) => {
            // TODO: 신고 API 연동
            void reason;
            void reportTarget;

            showToast("신고가 접수되었습니다.");
            setReportModalOpen(false);
            setReportTarget(null);
          }}
        />
      )}
    </div>
  );
}
