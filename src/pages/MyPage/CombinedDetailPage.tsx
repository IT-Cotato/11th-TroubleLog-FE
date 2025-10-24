import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import TagList from "@/entities/trouble/ui/TagList";
import PostCombineMd from "./PostCombineMd";
import KebabDropdown from "@/shared/ui/Menu/KebabDropdown";
import KebabMenuButton from "@/shared/ui/Menu/KebabMenuButton";
import HeaderWoSearch from "@/layouts/Header/HeaderWoSearch";
import imageIcon from "@/assets/icons/image.svg";
import starIcon from "@/assets/icons/star.svg";
import heartIcon from "@/assets/icons/heart.svg";
import likeEmptyIcon from "@/assets/icons/like_empty.svg";
import shareIcon from "@/assets/icons/share.svg";
import { PATH } from "@/shared/config/paths";

import {
  getCombinedDetail,
  hardDeletePost,
  getPostDetail,
} from "@/api/post.api";
import type { ViewCombinedResponse } from "@/models/post.model";
import { toTwoPaneVM } from "@/entities/trouble/mappers/combinedDetail.mapper";
import { useViewerId } from "@/store/auth";
import PostComment, {
  type PostCommentProps,
} from "@/entities/trouble/ui/PostComment";
import {
  createCommunityComment,
  getCommunityComments,
  getCommunityPostDetail,
  likeCommunityPost,
  replyCommunityComment,
  softDeleteCommunityComment,
  updateCommunityComment,
} from "@/api/community.api";
import {
  toPostComment,
  toPostComments,
} from "@/entities/trouble/mappers/communityComment.mapper";

export default function CombinedDetailPage() {
  const { postId, summaryId } = useParams<{
    postId: string;
    summaryId: string;
  }>();
  const viewerId = useViewerId();
  const navigate = useNavigate();

  const [vm, setVm] = useState<ReturnType<typeof toTwoPaneVM> | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [isMine, setIsMine] = useState(false);
  const [importance, setImportance] = useState(0);
  const [authorId, setAuthorId] = useState<number | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [authorProfile, setAuthorProfile] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCounts, setLikeCounts] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const likeLockRef = useRef(false);

  const [commentCounts, setCommentCounts] = useState(0);
  const [comments, setComments] = useState<PostCommentProps[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [isCommentPosting, setIsCommentPosting] = useState(false);
  const [cPage, setCPage] = useState(1);
  const [cHasNext, setCHasNext] = useState(false);
  const [cLoading, setCLoading] = useState(false);

  const viewMode: "mine_public" | "mine_private" | "others" = isMine
    ? isVisible
      ? "mine_public"
      : "mine_private"
    : "others";

  const showCombined = viewMode !== "others";
  const showAuthorCard = viewMode === "mine_public" || viewMode === "others";
  const showSocial =
    isVisible && (viewMode === "mine_public" || viewMode === "others");

  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );
  const showToast = (message: string) => {
    setToast({ open: true, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(
      () => setToast({ open: false, message: "" }),
      2000
    );
  };
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      //
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }
    return ok;
  };
  const handleCopyLink = async () => {
    const ok = await copyToClipboard(window.location.href);
    showToast(
      ok
        ? "링크가 복사되었어요!"
        : "복사에 실패했어요. 주소창에서 복사해주세요."
    );
  };

  const parseStar = (raw: unknown) => {
    if (typeof raw === "number") return raw;
    if (typeof raw !== "string") return 0;
    const k = raw.toUpperCase();
    const map: Record<string, number> = {
      ONE_STAR: 1,
      TWO_STARS: 2,
      THREE_STARS: 3,
      FOUR_STARS: 4,
      FIVE_STARS: 5,
      ONE: 1,
      TWO: 2,
      THREE: 3,
      FOUR: 4,
      FIVE: 5,
      NONE: 0,
    };
    return map[k] ?? 0;
  };

  type DetailContentItem = {
    id?: number;
    subTitle?: string | null;
    body?: string | null;
    sequence?: number;
  };

  function buildFreeformPrefill(detail: any) {
    const contents: DetailContentItem[] = Array.isArray(detail?.contents)
      ? detail.contents
      : [];

    const blocks = contents
      .slice()
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
      .map((c, i) => ({
        id: c.id ?? i,
        title: c.subTitle ?? "",
        content: c.body ?? "",
        isSaved: false,
      }));

    return {
      editorType: "FREEFORM" as const,
      title: detail?.title ?? "",
      tags: detail?.postTags ?? [],
      errorType: detail?.errorTag ?? null,
      blocks,
      savePrefill: {
        importance: parseStar(detail?.starRating),
        description: detail?.introduction ?? "",
        visibility: detail?.isVisible ? "public" : "private",
        projectId: detail?.projectId ?? null,
        projectName: undefined,
        thumbnail: detail?.thumbnailUrl ?? detail?.thumbnailImageUrl ?? null,
      },
      projectId: detail?.projectId ?? undefined,
    };
  }

  function buildTemplatePrefill(detail: any) {
    const contents: DetailContentItem[] = Array.isArray(detail?.contents)
      ? detail.contents
      : [];

    const blocks = contents
      .slice()
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
      .map((c, i) => ({
        id: c.id ?? i,
        content: c.body ?? "",
        checklist: [],
        checklistItems: [],
        checklistTitle: c.subTitle ? `${c.subTitle} 체크리스트` : "",
        question: c.subTitle ?? `질문 ${i + 1}`,
        isSaved: false,
      }));

    return {
      editorType: "TEMPLATE" as const,
      title: detail?.title ?? "",
      tags: detail?.postTags ?? [],
      errorType: detail?.errorTag ?? null,
      blocks,
      savePrefill: {
        importance: parseStar(detail?.starRating),
        description: detail?.introduction ?? "",
        visibility: detail?.isVisible ? "public" : "private",
        projectId: detail?.projectId ?? null,
        projectName: undefined,
        thumbnail: detail?.thumbnailUrl ?? detail?.thumbnailImageUrl ?? null,
      },
      projectId: detail?.projectId ?? undefined,
      // TempWritePage가 그대로 받아 쓰는 키
      checklistError: Array.isArray(detail?.checklistError)
        ? detail.checklistError
        : [],
      checklistReason: Array.isArray(detail?.checklistReason)
        ? detail.checklistReason
        : [],
    };
  }

  const SUMMARY_TYPE_LABELS: Record<string, string> = {
    RESUME: "자기소개서",
    INTERVIEW: "면접 대비",
    BLOG: "블로그",
    ISSUE_MANAGEMENT: "Issue 관리",
    SHORT: "짧은 요약",
    NONE: "없음",
  };
  const toKoSummaryType = (raw?: string | null) =>
    raw ? SUMMARY_TYPE_LABELS[raw] ?? raw : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const pid = Number(postId);
        const sid = Number(summaryId);
        if (!Number.isFinite(pid) || !Number.isFinite(sid))
          throw new Error("잘못된 경로 파라미터");

        const data = await getCombinedDetail(pid, sid);
        setVm(toTwoPaneVM(data as ViewCombinedResponse, viewerId ?? null));

        const post = (data as any)?.postResDto;
        const user = post?.userInfo ?? {};
        const mine =
          viewerId != null && String(user?.userId) === String(viewerId);

        if (!cancelled) {
          setIsMine(mine);
          setImportance(parseStar(post?.starRating));
          setAuthorId(user?.userId ?? null);
          setAuthorName(user?.nickname ?? "");
          setAuthorProfile(user?.profileImageUrl || null);
          setIsVisible(!!post?.isVisible);
          setLikeCounts(Number(post?.likeCount ?? 0));
          setCommentCounts(Number(post?.commentCount ?? 0));
        }

        if (post?.isVisible && Number.isFinite(pid)) {
          try {
            const community = await getCommunityPostDetail(pid);
            const initLiked = !!community?.liked;
            const initLikeCount = Number(community?.likeCount ?? likeCounts);
            if (!cancelled) {
              setIsLiked(initLiked);
              setLikeCounts(initLikeCount);
            }
          } catch {
            //
          }

          try {
            const resp = await getCommunityComments(pid, 1, 10);
            const mapped = toPostComments(resp.content, viewerId ?? null);
            if (!cancelled) {
              setComments(mapped);
              setCPage((resp.page ?? 1) + 1);
              setCHasNext(!!resp.hasNext);
              setCommentCounts(resp.totalElements ?? commentCounts);
            }
          } catch {
            //
          }
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "합본 상세 불러오기 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, summaryId, viewerId]);

  const loadComments = async (
    id: number,
    page1: number,
    currentViewerId: number | null
  ) => {
    setCLoading(true);
    try {
      const resp = await getCommunityComments(id, page1, 10);
      const mapped = toPostComments(resp.content, currentViewerId);
      setComments((prev) => (page1 === 1 ? mapped : [...prev, ...mapped]));
      setCPage((resp.page ?? page1) + 1);
      setCHasNext(!!resp.hasNext);
      setCommentCounts(resp.totalElements ?? commentCounts);
    } finally {
      setCLoading(false);
    }
  };
  const reloadCommentsFirstPage = useCallback(async () => {
    if (!postId) return;
    await loadComments(Number(postId), 1, viewerId ?? null);
  }, [postId, viewerId]);

  const handleToggleLike = async () => {
    if (!postId || !isVisible) return;
    if (likeLockRef.current) return;
    likeLockRef.current = true;
    setIsLiking(true);
    const pid = Number(postId);
    const wasLiked = isLiked;
    const prev = likeCounts;

    if (wasLiked) {
      setIsLiked(false);
      setLikeCounts(Math.max(0, prev - 1));
      try {
        await likeCommunityPost(pid);
      } catch {
        setIsLiked(true);
        setLikeCounts(prev);
      }
    } else {
      setIsLiked(true);
      setLikeCounts(prev + 1);
      try {
        const res = await likeCommunityPost(pid);
        setLikeCounts(res?.likeCount ?? prev + 1);
      } catch {
        setIsLiked(false);
        setLikeCounts(prev);
      }
    }
    likeLockRef.current = false;
    setIsLiking(false);
  };

  const handleSubmitComment = async () => {
    if (!postId || !isVisible) return;
    const contents = commentInput.trim();
    if (!contents || isCommentPosting) return;
    setIsCommentPosting(true);

    const optimistic: PostCommentProps = {
      id: `tmp-${Date.now()}`,
      profile: authorProfile ?? "",
      name: "나",
      date: new Date().toISOString(),
      content: contents,
      isMine: true,
      isReply: false,
    };

    setComments((prev) => [optimistic, ...prev]);
    setCommentCounts((cnt) => cnt + 1);
    setCommentInput("");

    try {
      const created = await createCommunityComment(Number(postId), {
        contents,
      });
      const mapped = toPostComment(created, viewerId ?? null, {
        isReply: false,
      });
      setComments((prev) => {
        const i = prev.findIndex((c) => c.id === optimistic.id);
        if (i === -1) return [mapped, ...prev];
        const next = [...prev];
        next[i] = mapped;
        return next;
      });
      await reloadCommentsFirstPage();
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setCommentCounts((cnt) => Math.max(0, cnt - 1));
      setCommentInput(contents);
    } finally {
      setIsCommentPosting(false);
    }
  };

  const handleReply = async (parentId: string, replyContent: string) => {
    if (!postId || !isVisible) return;
    const contents = replyContent.trim();
    if (!contents) return;
    const optimistic: PostCommentProps = {
      id: `tmp-${Date.now()}`,
      profile: authorProfile ?? "",
      name: "나",
      date: new Date().toISOString(),
      content: contents,
      isMine: true,
      isReply: true,
      parentId,
    };
    setComments((prev) => [...prev, optimistic]);
    try {
      const created = await replyCommunityComment(
        Number(postId),
        Number(parentId),
        { contents }
      );
      const mapped = toPostComment(created, viewerId ?? null, {
        isReply: true,
        parentId,
      });
      setComments((prev) => {
        const i = prev.findIndex((c) => c.id === optimistic.id);
        if (i === -1) return [...prev, mapped];
        const next = [...prev];
        next[i] = mapped;
        return next;
      });
      await reloadCommentsFirstPage();
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
    }
  };

  const handleEdit = async (id: string, newContent: string) => {
    if (!postId || !isVisible) return;
    try {
      const updated = await updateCommunityComment({
        postId: Number(postId),
        commentId: Number(id),
        contents: newContent,
      });
      const vm = toPostComment(updated, viewerId ?? null);
      setComments((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, content: vm.content, date: vm.date } : c
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isVisible) return;
    try {
      await softDeleteCommunityComment(Number(id));
      setComments((prev) => prev.filter((c) => c.id !== id));
      setCommentCounts((cnt) => Math.max(0, cnt - 1));
    } catch (e) {
      console.error(e);
    }
  };

  // 원본 수정(프리필) 네비게이션
  const navigatingRef = useRef(false);

  const goEditOriginal = useCallback(async () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setShowMenu(false);

    try {
      const pid = Number(postId);
      if (!Number.isFinite(pid)) throw new Error("잘못된 포스트 ID");

      const detail = await getPostDetail(pid);
      const tt = String((detail as any)?.templateType ?? "").toUpperCase();
      const isFreeform = tt === "FREE_FORM" || tt === "FREEFORM";

      const prefill = isFreeform
        ? buildFreeformPrefill(detail)
        : buildTemplatePrefill(detail);

      const editorPath = isFreeform ? PATH.FREEFORM_WRITING : PATH.TEMP_WRITING;

      navigate(editorPath, {
        replace: false,
        state: {
          ...prefill,
          postId: pid,
          mode: "edit",
          from: "combined-detail",
        },
      });
    } catch (e) {
      console.error(e);
      alert("수정 화면으로 이동할 수 없어요. 잠시 후 다시 시도해주세요.");
    } finally {
      navigatingRef.current = false;
    }
  }, [postId, navigate]);

  const handleDeletePost = useCallback(async () => {
    if (!postId) return;
    if (!window.confirm("원본 문서를 영구 삭제할까요? 복구할 수 없어요."))
      return;
    try {
      setDeleting(true);
      await hardDeletePost(Number(postId));
      alert("삭제되었습니다.");
      navigate(PATH.COMMUNITY, { replace: true });
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  }, [postId, navigate]);

  if (loading) {
    return (
      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 2xl:px-40">
        <div className="mx-auto max-w-5xl flex justify-center">
          <div className="w-full max-w-[1200px] flex flex-col gap-6 pt-24 sm:pt-[180px]">
            <div className="w-full h-[120px] bg-gray-100 rounded" />
            <div className="w-full h-[400px] bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }
  if (err || !vm) {
    return (
      <div className="w-full px-4 sm:px-6 md:px-8">
        <div className="mx-auto max-w-screen-2xl pt-24 sm:pt-[180px] text-red-600">
          {err ?? "데이터가 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <HeaderWoSearch />

      <div className="w-full px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 2xl:px-40">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-12 sm:gap-[50px] mb-24 sm:mb-[224px]">
          {/* 상단 헤더 */}
          <div className="w-full pt-20 sm:pt-[180px] pb-4 sm:pb-[18px] border-b border-gray1">
            <div className="flex flex-col gap-6 sm:gap-[40px] w-full">
              <div className="flex w-full justify-between items-start gap-3">
                <span className="text-head-20-semibold break-words">
                  {vm.header.errorType}
                </span>
                <div className="relative" ref={menuRef}>
                  <KebabMenuButton onClick={() => setShowMenu(!showMenu)} />
                  {showMenu && (
                    <KebabDropdown
                      options={[
                        { label: "원본 수정", onClick: () => goEditOriginal() },
                        {
                          label: deleting ? "삭제 중..." : "원본 삭제",
                          onClick: () => !deleting && handleDeletePost(),
                        },
                      ]}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:gap-[40px] w-full">
                <div className="text-head-48 break-words">
                  {vm.header.title}
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-[16px] min-w-0">
                  <TagList tags={vm.header.tags} variant="post" />
                  <div className="text-body-16-regular text-gray3">·</div>
                  <div className="text-body-20-regular text-gray3">
                    {vm.header.date}
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 sm:gap-[20px]">
                  <img
                    src={authorProfile || imageIcon}
                    onError={(e) => {
                      e.currentTarget.src = imageIcon;
                    }}
                    alt="profile"
                    className="w-12 h-12 sm:w-[66px] sm:h-[66px] rounded-full object-cover"
                  />
                  <div className="text-head-24-bold break-words">
                    {authorName}
                  </div>
                </div>

                {isMine && importance > 0 && (
                  <div className="flex items-center gap-2 sm:gap-[8px]">
                    <img
                      src={starIcon}
                      alt="importance"
                      className="w-5 h-5 sm:w-[24px] sm:h-[24px]"
                    />
                    <div className="text-body-20-regular text-gray3">
                      {importance}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 본문: 좌(원본) | 우(요약) */}
          <div
            className={`grid gap-6 sm:gap-[32px] w-full ${
              showCombined ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* 원본 */}
            <section className="flex flex-col gap-4 sm:gap-[24px] min-w-0">
              <div className="text-head-24-bold">원본</div>
              <div className="flex flex-col gap-6 sm:gap-[32px]">
                {vm.left.questions.map((q, i) => (
                  <PostCombineMd
                    key={`L-${i}`}
                    question={q}
                    content={vm.left.contents[i]}
                  />
                ))}
              </div>
            </section>

            {/* 요약 */}
            {showCombined && (
              <section className="flex flex-col gap-4 sm:gap-[24px] lg:border-l lg:border-gray1 lg:pl-0 lg:pl-[32px] min-w-0">
                <div className="flex items-center gap-3 sm:gap-[12px]">
                  <div className="text-head-24-bold">요약</div>
                  {vm.right.summaryType && (
                    <span className="text-body-16-regular text-gray3">
                      ({toKoSummaryType(vm.right.summaryType)})
                    </span>
                  )}
                </div>

                {vm.right.questions.length === 0 ? (
                  <div className="text-body-18-regular text-gray3">
                    아직 생성된 요약이 없어요.
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 sm:gap-[32px]">
                    {vm.right.questions.map((q, i) => (
                      <PostCombineMd
                        key={`R-${i}`}
                        question={q}
                        content={vm.right.contents[i]}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* 작성자 카드 */}
          {showAuthorCard && (
            <div className="flex py-6 sm:py-[32px] px-5 sm:px-[40px] flex-col items-start gap-[10px] self-stretch rounded-[24px] sm:rounded-[36px] bg-[#F2F2F2]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center self-stretch gap-4">
                <div
                  className="flex items-center gap-4 sm:gap-[28px] cursor-pointer"
                  onClick={() => authorId && navigate(PATH.MYPAGE_BASE)}
                >
                  <img
                    src={authorProfile || imageIcon}
                    onError={(e) => {
                      e.currentTarget.src = imageIcon;
                    }}
                    alt="profile"
                    className="w-20 h-20 sm:w-[131px] sm:h-[131px] rounded-full object-cover"
                  />
                  <div className="flex flex-col items-start gap-2 sm:gap-[13px]">
                    <div className="text-head-24-bold break-words">
                      {authorName}
                    </div>
                    <div className="text-body-16-regular text-gray3">
                      작성자
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 좋아요/공유 */}
          {showSocial && (
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

          {/* 댓글 */}
          {showSocial && (
            <>
              <div className="flex flex-col items-end gap-3 sm:gap-[12px] self-stretch">
                <div className="flex flex-col items-start gap-6 sm:gap-[36px] self-stretch">
                  <div className="text-head-32-semibold">
                    {commentCounts}개의 댓글
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
                  className={`flex px-6 sm:pl-[32px] sm:pr-[31px] py-2 sm:pt-[8px] sm:pb-[12px] justify-center items-center rounded-[100px] text-head-20-semibold text-white transition-colors ${
                    commentInput.trim() && !isCommentPosting
                      ? "bg-primary"
                      : "bg-subColor1"
                  }`}
                >
                  {isCommentPosting ? "작성 중…" : "작성하기"}
                </button>
              </div>

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
                          />
                        ))}
                    </div>
                  ))}

                {cHasNext && postId && (
                  <button
                    disabled={cLoading}
                    onClick={() =>
                      loadComments(Number(postId), cPage, viewerId ?? null)
                    }
                    className={`mt-4 px-6 py-2 rounded-full text-white ${
                      cLoading ? "bg-gray-300" : "bg-primary"
                    }`}
                  >
                    {cLoading ? "불러오는 중…" : "댓글 더 보기"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {toast.open && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black text-white text-body-16-regular shadow-card z-50"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
