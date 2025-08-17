import TagList from "@/components/Card/TagList";
import PostComment, {
  type PostCommentProps,
} from "@/components/Community/PostComment";
import PostGuideMd from "@/components/Community/PostGuideMd";
import KebabDropdown from "@/components/Menu/KebabDropdown";
import KebabMenuButton from "@/components/Menu/KebabMenuButton";
import { PATH } from "@/constants/paths";
import useClickOutside from "@/hooks/useClickOutside";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import imageIcon from "@/assets/icons/image.svg";
import starIcon from "@/assets/icons/star.svg";
import heartIcon from "@/assets/icons/heart.svg";
import likeEmptyIcon from "@/assets/icons/like_empty.svg";
import shareIcon from "@/assets/icons/share.svg";
import {
  createCommunityComment,
  getCommunityComments,
  getCommunityPostDetail,
  likeCommunityPost,
  replyCommunityComment,
  softDeleteCommunityComment,
  updateCommunityComment,
} from "@/api/community.api";
import { toCommunityPostVM } from "@/mappers/communityPostDetail.mapper";
import {
  makeOptimisticComment,
  toPostComment,
  toPostComments,
} from "@/mappers/communityComment.mapper";
import { useViewerId } from "@/store/auth";
import { deletePost, getPostDetail } from "@/api/post.api";
import { toPostDetailVM } from "@/mappers/myPostDetail.mapper";
import { postFollow, postUnfollow } from "@/api/user.api";

export interface CommunityPostDetailProps {
  errorType: string;
  title: string;
  tags: string[];
  date: string;
  isMine: boolean;
  authorId?: number;
  authorProfile?: string;
  authorName: string;
  authorFollowers: number;
  authorBio: string;
  isFollowed: boolean;
  importance: number;
  questions: string[];
  contents: (string | { type: "image"; src: string; alt?: string })[][];
  isLiked: boolean;
  likeCounts: number;
  commentCounts: number;
  comments: PostCommentProps[];
}

export default function CommunityPostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<CommunityPostDetailProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 좋아요/댓글 로컬 상태
  const [isLiked, setIsLiked] = useState(false);
  const [likeCounts, setLikeCounts] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const likeLockRef = useRef(false);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<PostCommentProps[]>([]);

  // 댓글 작성 상태
  const [isCommentPosting, setIsCommentPosting] = useState(false);

  // 댓글 페이징 상태
  const [cPage, setCPage] = useState(1);
  const [cHasNext, setCHasNext] = useState(false);
  const [cLoading, setCLoading] = useState(false);

  // 케밥 메뉴
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  // 섹션 추적
  const [currentSection, setCurrentSection] = useState<number>(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // 이어서 작성 안내 경고창
  const resumePromptShownRef = useRef<Record<number, boolean>>({});

  // 컨텍스트/판정 유틸
  type FromSource = "home" | "community" | "search" | "mypage" | undefined;

  type DetailContentItem = {
    id?: number;
    subTitle?: string | null;
    body?: string | null;
    sequence?: number;
  };

  function useDetailContext() {
    const location = useLocation();
    const viewerIdInStore = useViewerId();

    const stateFrom = (location.state as any)?.from as FromSource | undefined;
    const stateOwnerId = (location.state as any)?.ownerId as number | undefined;

    const qs = new URLSearchParams(location.search);
    const qsFrom = (qs.get("from") as FromSource) || undefined;
    const qsOwnerId = qs.get("ownerId");
    const ownerId = stateOwnerId ?? (qsOwnerId ? Number(qsOwnerId) : undefined);
    const from = stateFrom ?? qsFrom;

    return { from, ownerId, viewerId: viewerIdInStore };
  }

  function shouldTryMyDetailFirst(params: {
    from?: FromSource;
    ownerId?: number;
    viewerId?: number | null;
  }) {
    const { from, ownerId, viewerId } = params;
    const isMine =
      viewerId != null &&
      ownerId != null &&
      String(ownerId) === String(viewerId);

    // 포스트 상세를 먼저 시도해야 하는 경우
    if (from === "home") return true;
    if (from === "mypage" && isMine) return true;
    if (from === "search" && isMine) return true;
    if (from === "community" && isMine) return true;

    // 커뮤니티 상세를 먼저 시도해야 하는 경우
    if (from === "community" && !isMine) return false;
    if (from === "search" && !isMine) return false;
    if (from === "mypage" && !isMine) return false;

    // 기본은 커뮤니티 우선
    return false;
  }

  // 별점 enum/문자 → 숫자
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

  // 상세 응답 → FREEFORM 프리필 state
  function buildFreeformPrefill(detail: any) {
    const contents: DetailContentItem[] = Array.isArray(detail?.contents)
      ? detail.contents
      : [];

    const blocks = contents
      .slice()
      .sort(
        (a: DetailContentItem, b: DetailContentItem) =>
          (a.sequence ?? 0) - (b.sequence ?? 0)
      )
      .map((c: DetailContentItem, i: number) => ({
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
        thumbnail: detail?.thumbnailUrl ?? null,
      },
      projectId: detail?.projectId ?? undefined,
    };
  }

  // 상세 응답 → TEMPLATE 프리필 state
  function buildTemplatePrefill(detail: any) {
    const contents: DetailContentItem[] = Array.isArray(detail?.contents)
      ? detail.contents
      : [];

    const blocks = contents
      .slice()
      .sort(
        (a: DetailContentItem, b: DetailContentItem) =>
          (a.sequence ?? 0) - (b.sequence ?? 0)
      )
      .map((c: DetailContentItem, i: number) => ({
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
        thumbnail: detail?.thumbnailUrl ?? null,
      },
      projectId: detail?.projectId ?? undefined,
    };
  }

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
          : "복사에 실패했어요. 주소창에서 복사해주세요."
      );
    } catch {
      showToast("복사에 실패했어요. 주소창에서 복사해주세요.");
    }
  };

  // 댓글 로더
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

      const nextPage1 = typeof resp.page === "number" ? resp.page + 1 : page1;
      setCPage(nextPage1);
      setCHasNext(!!resp.hasNext);

      setPost((prev) =>
        prev
          ? { ...prev, commentCounts: resp.totalElements ?? prev.commentCounts }
          : prev
      );
    } finally {
      setCLoading(false);
    }
  };

  // 상세 로드
  const {
    from: fromCtx,
    ownerId,
    viewerId: currentViewerId,
  } = useDetailContext();
  const preferMyFirst = shouldTryMyDetailFirst({
    from: fromCtx,
    ownerId,
    viewerId: currentViewerId,
  });
  const [isCommunitySource, setIsCommunitySource] = useState(true); // 좋아요/댓글 표시 가드

  useEffect(() => {
    let cancelled = false;

    setComments([]);
    setCPage(1);
    setCHasNext(false);
    setLoading(true);
    setLoadError(null);

    const numId = Number(postId);
    if (!Number.isFinite(numId)) {
      setLoadError("잘못된 포스트 ID");
      setLoading(false);
      return;
    }

    const loadCommunity = async () => {
      const communityData = await getCommunityPostDetail(numId);
      if (!communityData) throw new Error("빈 응답입니다."); // 널 가드
      const vm = toCommunityPostVM(communityData, currentViewerId);
      setPost(vm);
      setIsLiked(vm.isLiked);
      setLikeCounts(vm.likeCounts);
      setIsCommunitySource(true);
      void loadComments(numId, 1, currentViewerId ?? null);
    };

    const loadMine = async (id: number) => {
      const myDetail = await getPostDetail(id);

      // 화면용 VM 세팅
      const vmMine = toPostDetailVM(myDetail as any, currentViewerId);
      setPost(vmMine);
      setIsLiked(vmMine.isLiked);
      setLikeCounts(vmMine.likeCounts);
      setIsCommunitySource(false);

      // 초안 여부 판단 (completedAt이 null)
      const completedAt = (myDetail as any)?.completedAt ?? null;
      const templateTypeRaw =
        (myDetail as any)?.templateType ?? (vmMine as any)?.templateType;
      const tt = String(templateTypeRaw ?? "").toUpperCase(); // "FREE_FORM" | "GUIDELINE" | "FREEFORM"
      const isDraft = completedAt == null;

      // 이 postId에 대해 안내창을 이미 띄웠다면 다시 띄우지 않음
      if (isDraft && !resumePromptShownRef.current[id]) {
        resumePromptShownRef.current[id] = true;

        const ok = window.confirm(
          tt === "FREE_FORM" || tt === "FREEFORM"
            ? "이 문서는 자유형식 글 작성 중이에요. 이어서 작성할까요?"
            : "이 문서는 가이드 템플릿 글 작성 중이에요. 이어서 작성할까요?"
        );

        if (ok) {
          const baseState =
            tt === "FREE_FORM" || tt === "FREEFORM"
              ? buildFreeformPrefill(myDetail)
              : buildTemplatePrefill(myDetail);

          const editorPath =
            tt === "FREE_FORM" || tt === "FREEFORM"
              ? PATH.FREEFORM_WRITING
              : PATH.TEMP_WRITING;

          navigate(editorPath, {
            replace: true,
            state: {
              ...baseState,
              // 이어쓰기 식별자 (에디터에서 이 값이 있으면 editPost 분기)
              postId: id,
              mode: "edit",
              from: "community-detail",
              projectId: (myDetail as any)?.projectId ?? undefined,
              savePrefill: {
                ...(baseState as any).savePrefill,
              },
            },
          });
        }
      }
    };

    (async () => {
      try {
        if (preferMyFirst) {
          try {
            await loadMine(numId);
          } catch {
            await loadCommunity();
          }
        } else {
          try {
            await loadCommunity();
          } catch (err: any) {
            const status = err?.response?.status ?? err?.status;
            if (status === 401 || status === 403 || status === 404) {
              await loadMine(numId);
            } else {
              throw err;
            }
          }
        }
      } catch (err: any) {
        if (!cancelled)
          setLoadError(
            err?.response?.data?.message ??
              err?.message ??
              "포스트 불러오기 실패"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId, currentViewerId, fromCtx, ownerId, preferMyFirst, navigate]);

  // 수정 화면으로 이동(프리필 포함)
  const goEditWithPrefill = useCallback(async () => {
    const pid = Number(postId);
    if (!Number.isFinite(pid)) return;

    setShowMenu(false);

    try {
      const myDetail = await getPostDetail(pid);
      const tt = String((myDetail as any)?.templateType ?? "").toUpperCase(); // FREE_FORM | GUIDELINE | FREEFORM

      const isFreeform = tt === "FREE_FORM" || tt === "FREEFORM";
      const editorPath = isFreeform ? PATH.FREEFORM_WRITING : PATH.TEMP_WRITING;
      const prefill = isFreeform
        ? buildFreeformPrefill(myDetail)
        : buildTemplatePrefill(myDetail);

      navigate(editorPath, {
        replace: true,
        state: {
          ...prefill,
          postId: pid,
          mode: "edit",
          from: "community-detail",
        },
      });
    } catch (err) {
      console.error(err);
      alert(
        "수정 화면으로 이동하기 위한 상세 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요."
      );
    }
  }, [postId, navigate, setShowMenu]);

  // 작성자 프로필 클릭
  const handleProfileClick = () => {
    if (!post) return;
    navigate(PATH.MYPAGE(String(post.authorId) || ""));
  };

  // 좋아요 토글(커뮤니티 글에서만)
  const handleToggleLike = async () => {
    if (!postId) return;
    if (!isCommunitySource) {
      alert("작성 중/비공개 문서는 좋아요를 사용할 수 없어요.");
      return;
    }
    if (likeLockRef.current) return;
    likeLockRef.current = true;
    setIsLiking(true);

    const pid = Number(postId);
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

  // 댓글 제출(커뮤니티 글에서만)
  const handleSubmitComment = async () => {
    if (!postId || !isCommunitySource) return;
    const contents = commentInput.trim();
    if (!contents || isCommentPosting) return;

    setIsCommentPosting(true);

    const optimistic = makeOptimisticComment({ contents });
    setComments((prev) => [optimistic, ...prev]);
    setPost((p) =>
      p ? { ...p, commentCounts: (p.commentCounts ?? 0) + 1 } : p
    );
    setCommentInput("");

    try {
      const created = await createCommunityComment(Number(postId), {
        contents,
      });
      const mapped = toPostComment(created, currentViewerId, {
        isReply: false,
      });
      setComments((prev) => {
        const i = prev.findIndex((c) => c.id === optimistic.id);
        if (i === -1) return [mapped, ...prev];
        const next = [...prev];
        next[i] = mapped;
        return next;
      });
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setPost((p) =>
        p ? { ...p, commentCounts: Math.max(0, (p.commentCounts ?? 1) - 1) } : p
      );
      setCommentInput(contents);
    } finally {
      setIsCommentPosting(false);
    }
  };

  // 대댓글 제출
  const handleReply = async (parentId: string, replyContent: string) => {
    if (!postId || !isCommunitySource) return;
    const contents = replyContent.trim();
    if (!contents) return;

    const optimistic = makeOptimisticComment({ contents, parentId });
    setComments((prev) => [...prev, optimistic]);

    try {
      const created = await replyCommunityComment(
        Number(postId),
        Number(parentId),
        { contents }
      );
      const mapped = toPostComment(created, currentViewerId, {
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
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      console.error("대댓글 작성 실패");
    }
  };

  // 댓글 내용 수정
  const handleEdit = async (id: string, newContent: string) => {
    if (!postId || !isCommunitySource) return;
    const pid = Number(postId);
    const cid = Number(id);
    try {
      const updated = await updateCommunityComment({
        postId: pid,
        commentId: cid,
        contents: newContent,
      });
      const vm = toPostComment(updated, currentViewerId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, content: vm.content, date: vm.date } : c
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  // 댓글 삭제 (soft)
  const handleDelete = async (id: string) => {
    if (!isCommunitySource) return;
    try {
      await softDeleteCommunityComment(Number(id));
      setComments((prev) => prev.filter((c) => c.id !== id));
      setPost((prev) =>
        prev
          ? { ...prev, commentCounts: Math.max(0, prev.commentCounts - 1) }
          : prev
      );
    } catch (e) {
      console.error(e);
    }
  };

  // 포스트 삭제
  const handleDeletePost = useCallback(async () => {
    if (!postId) return;
    if (
      !window.confirm(
        "이 문서를 영구적으로 삭제할까요? 삭제 후에는 복구할 수 없습니다."
      )
    )
      return;

    try {
      setDeleting(true);
      await deletePost(Number(postId));
      alert("문서가 영구 삭제되었습니다.");

      if (fromCtx === "community") {
        navigate(PATH.COMMUNITY, { replace: true });
      } else {
        navigate(-1);
      }
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ??
          "삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  }, [postId, navigate, fromCtx]);

  // 스크롤 감시
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      let cur = 0;
      sectionRefs.current.forEach((ref, idx) => {
        if (ref) {
          const top = ref.getBoundingClientRect().top + window.scrollY;
          if (y >= top - 250) cur = idx;
        }
      });
      setCurrentSection(cur);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (idx: number) => {
    const target = sectionRefs.current[idx];
    if (target) {
      window.scrollTo({ top: target.offsetTop - 180, behavior: "smooth" });
    }
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
        : prev
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
          : prev
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
        : prev
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
          : prev
      );
      console.error("언팔로우 실패", e);
    }
  };

  // 로딩/에러 처리
  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="flex flex-col items-start max-w-[1200px] ml-[360px] mr-[36px] gap-[24px] w-full pt-[180px]">
          <div className="w-full h-[120px] bg-gray-100 rounded" />
          <div className="w-full h-[400px] bg-gray-100 rounded" />
        </div>
      </div>
    );
  }
  if (loadError || !post) {
    return (
      <div className="flex justify-center">
        <div className="max-w=[1200px] w-full pt-[180px] text-red-600">
          {loadError ?? "포스트를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      {/* 포스트 영역 */}
      <div className="flex flex-col items-start max-w-[1200px] ml-[360px] mr-[36px] gap-[56px] mb-[224px]">
        {/* 상단 영역 */}
        <div className="flex w-full pt-[180px] pb-[18px] items-center border-b border-gray1">
          <div className="flex flex-col items-start gap-[44px]">
            <div className="flex flex-col items-start gap-[53px]">
              <div className="flex flex-col items-start gap-[10px]">
                {/* 에러 종류 & (케밥 버튼) */}
                <div className="flex w-[1200px] justify-between items-start">
                  <span className="text-head-20-semibold">
                    {post.errorType}
                  </span>
                  {post.isMine && (
                    <div className="relative" ref={menuRef}>
                      <KebabMenuButton onClick={() => setShowMenu(!showMenu)} />
                      {showMenu && (
                        <KebabDropdown
                          options={[
                            {
                              label: "포스트 수정",
                              onClick: () => {
                                void goEditWithPrefill();
                              },
                            },
                            {
                              label: deleting ? "삭제 중..." : "삭제",
                              onClick: () => !deleting && handleDeletePost(),
                            },
                          ]}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* 포스트 제목 */}
                <div className="text-head-48">{post.title}</div>
              </div>

              {/* 태그 & 작성일 */}
              <div className="flex items-center gap-[16px]">
                <TagList tags={post.tags} variant="post" />
                <div className="text-body-16-regular text-gray3">·</div>
                <div className="text-body-20-regular text-gray3">
                  {post.date}
                </div>
              </div>
            </div>

            {/* 작성자 정보 & 중요도 */}
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-[20px]">
                <img
                  src={post.authorProfile || imageIcon}
                  onError={(e) => {
                    e.currentTarget.src = imageIcon;
                  }}
                  alt="profile"
                  className="w-[66px] h-[66px]"
                />
                <div className="text-head-24-bold">{post.authorName}</div>
              </div>

              {post.isMine && post.importance !== 0 && (
                <div className="flex items-center gap-[8px]">
                  <img
                    src={starIcon}
                    alt="importance"
                    className="w-[24px] h-[24px]"
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
            {/* 포스트 내용 & 작성자 정보 */}
            <div className="flex flex-col items-start self-stretch">
              <div className="flex flex-col items-start gap-[48px] self-stretch">
                {/* 포스트 내용 */}
                <div className="flex flex-col items-start gap-[48px] self-stretch">
                  {post.questions.map((q, idx) => (
                    <div
                      id={`section-${idx}`}
                      key={idx}
                      ref={(el) => {
                        sectionRefs.current[idx] = el;
                      }}
                      className="scroll-mt-[200px]"
                    >
                      <PostGuideMd question={q} content={post.contents[idx]} />
                    </div>
                  ))}
                </div>

                {/* 작성자 정보 */}
                <div className="flex py-[32px] px-[40px] flex-col items-start gap-[10px] self-stretch rounded-[36px] bg-[#F2F2F2]">
                  <div className="flex justify-between items-center self-stretch">
                    <div
                      className="flex items-center gap-[28px] cursor-pointer"
                      onClick={handleProfileClick}
                    >
                      <img
                        src={post.authorProfile || imageIcon}
                        onError={(e) => {
                          e.currentTarget.src = imageIcon;
                        }}
                        alt="profile"
                        className="w-[131px] h-[131px]"
                      />
                      <div className="flex flex-col items-start gap-[13px]">
                        <div className="flex flex-col items-start gap-[2px]">
                          <div className="text-head-24-bold">
                            {post.authorName}
                          </div>
                          <div className="text-body-16-regular">
                            {post.authorFollowers} 팔로워
                          </div>
                        </div>
                        <div className="text-body-18-regular">
                          {post.authorBio}
                        </div>
                      </div>
                    </div>

                    {/* 팔로우 버튼 */}
                    {!post.isMine && (
                      <>
                        {post.isFollowed ? (
                          <button
                            onClick={() => handleUnfollow()}
                            className="flex py-[18px] pl-[41px] pr-[40px] justify-center items-center rounded-[100px] bg-subColor1 text-head-20-semibold text-white cursor-pointer"
                          >
                            팔로잉
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFollow()}
                            className="flex py-[18px] pl-[41px] pr-[40px] justify-center items-center rounded-[100px] bg-primary text-head-20-semibold text-white cursor-pointer"
                          >
                            팔로우
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 좋아요, 공유 (커뮤니티 글에서만 노출) */}
            {isCommunitySource && (
              <div className="flex pt-[52px] pb-[20px] items-center self-stretch border-b border-gray1">
                <div className="flex items-center gap-[20px]">
                  <button
                    type="button"
                    aria-pressed={isLiked}
                    aria-busy={isLiking}
                    disabled={isLiking}
                    onClick={handleToggleLike}
                    className={`flex items-center gap-[8px] ${
                      isLiking
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <img
                      src={isLiked ? heartIcon : likeEmptyIcon}
                      alt="like"
                      className="w-[40px] h-[40px]"
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
                      className="w-[40px] h-[40px]"
                    />
                  </button>
                </div>
              </div>
            )}

            {/* 댓글 작성 창 (커뮤니티 글에서만) */}
            {isCommunitySource && (
              <div className="flex flex-col items-end gap-[12px] self-stretch">
                <div className="flex flex-col items-start gap-[36px] self-stretch">
                  <div className="text-head-32-semibold">
                    {post.commentCounts}개의 댓글
                  </div>
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="댓글을 작성해주세요."
                    className="flex pt-[28px] pl-[32px] pb-[130px] w-full items-start self-stretch resize-none rounded-[24px] bg-white shadow-card text-body-20-regular text-[#757575] focus:outline-none"
                  ></textarea>
                </div>

                <button
                  disabled={!commentInput.trim() || isCommentPosting}
                  onClick={handleSubmitComment}
                  className={`flex pt-[8px] pl-[32px] pb-[12px] pr-[31px] justify-center items-center rounded-[100px] text-head-20-semibold text-white transition-colors ${
                    commentInput.trim() && !isCommentPosting
                      ? "bg-primary"
                      : "bg-subColor1"
                  }`}
                >
                  {isCommentPosting ? "작성 중…" : "작성하기"}
                </button>
              </div>
            )}
          </div>

          {/* 댓글 목록 (커뮤니티 글에서만) */}
          {isCommunitySource && (
            <div className="flex flex-col items-end self-stretch">
              {comments
                .filter((c) => !c.isReply)
                .map((parent) => (
                  <div key={parent.id} className="w-full">
                    <PostComment
                      {...parent}
                      onEdit={(newContent) => handleEdit(parent.id, newContent)}
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
                          onReply={(replyContent) =>
                            handleReply(reply.id, replyContent)
                          }
                        />
                      ))}
                  </div>
                ))}

              {cHasNext && postId && (
                <button
                  disabled={cLoading}
                  onClick={() =>
                    loadComments(Number(postId), cPage, currentViewerId ?? null)
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

      {/* 목차 */}
      <div
        className="inline-flex items-start mt-[588px] mr-[89px]
        sticky top-[588px] h-fit
        w-[220px] sm:w-[240px] md:w-[280px] lg:w-[320px]
        flex-shrink-0"
      >
        <div
          className=" flex flex-col items-start gap-[16px]
          border-l border-gray3
          pl-[12px] pr-[8px]  
          text-body-20-regular text-gray3
          w-full"
        >
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
      </div>

      {/* 토스트 UI (공유 관련) */}
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
