import TagList from "@/entities/trouble/ui/TagList";
import PostComment, {
  type PostCommentProps,
} from "@/components/Community/PostComment";
import PostGuideMd from "@/components/Community/PostGuideMd";
import KebabDropdown from "@/components/Menu/KebabDropdown";
import KebabMenuButton from "@/components/Menu/KebabMenuButton";
import { PATH } from "@/shared/config/paths";
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
import { getPostDetail, hardDeletePost } from "@/api/post.api";
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
  checklistError?: number[];
  checklistReason?: number[];
}

export default function CommunityPostDetail() {
  const HEADER_OFFSET = 100;

  // 고정 폭(상단 콘텐츠/본문 공통)
  const CONTENT_WIDTH_CLASS =
    "w-full sm:w-[600px] md:w-[720px] lg:w-[920px] xl:w-[1200px]";

  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<CommunityPostDetailProps | null>(null);
  const [loading, setLoading] = useState(true);
  type LoadErr = { status?: number; message: string };
  const [loadError, setLoadError] = useState<LoadErr | null>(null);

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
  const closeMenu = useCallback(() => setShowMenu(false), []);
  const menuRef = useClickOutside(() => setShowMenu(false));

  // 섹션 추적
  const [currentSection, setCurrentSection] = useState<number>(0);
  // 본문 컬럼과 첫 섹션 기준 측정
  const contentColRef = useRef<HTMLDivElement | null>(null);
  const [asideOffset, setAsideOffset] = useState(0);
  // 섹션 refs는 HTMLDivElement로 구체화
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);

  // 서버 에러 응답 파싱
  const parseApiError = (err: any): LoadErr => {
    const status = err?.response?.status;
    const message =
      err?.response?.data?.error?.message ??
      err?.response?.data?.message ??
      err?.message ??
      "요청 처리 중 오류가 발생했어요.";
    return { status, message };
  };

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

  // 이어서 작성 안내 경고창
  const resumePromptShownRef = useRef<Record<number, boolean>>({});

  // 컨텍스트/판정 유틸
  type FromSource =
    | "home"
    | "community"
    | "search"
    | "mypage"
    | "project"
    | undefined;
  type SearchScope = "my" | "community" | undefined;

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

    const stateScope = (location.state as any)?.searchScope as
      | SearchScope
      | undefined;
    const qsScope = (qs.get("scope") as SearchScope) || undefined;
    const searchScope = stateScope ?? qsScope;

    // 목록에서 실어온 힌트
    const statusFromList = (location.state as any)?.statusFromList as
      | "inProgress"
      | "complete"
      | "created"
      | undefined;
    const isVisibleFromList = (location.state as any)?.isVisibleFromList as
      | boolean
      | undefined;
    const summaryIdFromList = (location.state as any)?.summaryIdFromList as
      | number
      | undefined;
    const isMineFromList = (location.state as any)?.isMineFromList as
      | boolean
      | undefined;

    return {
      from,
      ownerId,
      viewerId: viewerIdInStore,
      searchScope,
      statusFromList,
      isVisibleFromList,
      summaryIdFromList,
      isMineFromList,
    };
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
      // TempWritePage에서 기대하는 키 이름으로 전달
      checklistError: Array.isArray(detail?.checklistError)
        ? detail.checklistError
        : [],
      checklistReason: Array.isArray(detail?.checklistReason)
        ? detail.checklistReason
        : [],
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
  const detailCtx = useDetailContext();
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
      setLoadError({ message: "잘못된 포스트 ID" });
      setLoading(false);
      return;
    }

    const loadCommunity = async () => {
      const communityData = await getCommunityPostDetail(numId);
      if (!communityData) throw new Error("빈 응답입니다.");
      const vm = toCommunityPostVM(communityData, detailCtx.viewerId);
      setPost(vm);
      setIsLiked(vm.isLiked);
      setLikeCounts(vm.likeCounts);
      setIsCommunitySource(true);
      void loadComments(numId, 1, detailCtx.viewerId ?? null);
    };

    const loadMineDraft = async (id: number) => {
      const myDetail = await getPostDetail(id);

      // 작성 중 여부
      const completedAt = (myDetail as any)?.completedAt ?? null;
      const isDraft = completedAt == null;

      if (!isDraft) {
        throw new Error("완료 문서입니다. 커뮤니티 상세로 이동해야 합니다.");
      }

      // 내 상세로 화면 세팅
      const vmMine = toPostDetailVM(myDetail as any, detailCtx.viewerId);
      setPost(vmMine);
      setIsLiked(vmMine.isLiked);
      setLikeCounts(vmMine.likeCounts);
      setIsCommunitySource(false);

      // 이어쓰기 안내(한 번만)
      if (!resumePromptShownRef.current[id]) {
        resumePromptShownRef.current[id] = true;

        const ttRaw =
          (myDetail as any)?.templateType ?? (vmMine as any)?.templateType;
        const tt = String(ttRaw ?? "").toUpperCase(); // FREE_FORM | FREEFORM | GUIDELINE

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
              postId: id,
              mode: "edit",
              from: "community-detail",
              projectId: (myDetail as any)?.projectId ?? undefined,
              savePrefill: { ...(baseState as any).savePrefill },
            },
          });
        }
      }
    };

    (async () => {
      try {
        const {
          viewerId,
          ownerId,
          statusFromList,
          isVisibleFromList,
          summaryIdFromList,
          isMineFromList,
        } = detailCtx;

        // 내 글 여부 결정(힌트 우선)
        const mineByIds =
          viewerId != null &&
          ownerId != null &&
          String(ownerId) === String(viewerId);
        const isMine = isMineFromList === true ? true : mineByIds;

        // 1) 힌트가 있으면 즉시 분기 (중복 호출 차단)
        if (isMine && statusFromList === "inProgress") {
          // 작성 중 → 에디터(프리필 위해 1회 내 상세 호출)
          await loadMineDraft(numId);
          return;
        }

        if (isMine && statusFromList === "created") {
          if (summaryIdFromList != null) {
            navigate(PATH.COMBINED_DETAIL(numId, summaryIdFromList), {
              replace: true,
              state: {
                from: "community-detail",
                ownerId: viewerId ?? undefined,
              },
            });
            return;
          }
          // 힌트에 summaryId가 없으면 한 번만 내 상세 조회로 보강
          try {
            const myDetail = await getPostDetail(numId);
            const sid =
              (typeof (myDetail as any)?.postSummaryId === "number" &&
                (myDetail as any).postSummaryId) ||
              (typeof (myDetail as any)?.summaryId === "number" &&
                (myDetail as any).summaryId) ||
              null;
            if (sid != null) {
              navigate(PATH.COMBINED_DETAIL(numId, sid), {
                replace: true,
                state: {
                  from: "community-detail",
                  ownerId: viewerId ?? undefined,
                },
              });
              return;
            }
          } catch {
            /* 무시하고 커뮤 상세로 폴백 */
          }
          await loadCommunity();
          return;
        }

        if (
          isMine &&
          statusFromList === "complete" &&
          typeof isVisibleFromList === "boolean"
        ) {
          if (isVisibleFromList) {
            // 공개 완료 → 커뮤니티 상세만
            await loadCommunity();
          } else {
            // 비공개 완료 → 내 상세만
            const myDetail = await getPostDetail(numId);
            const vmMine = toPostDetailVM(myDetail as any, viewerId);
            setPost(vmMine);
            setIsLiked(vmMine.isLiked);
            setLikeCounts(vmMine.likeCounts);
            setIsCommunitySource(false);
          }
          return;
        }

        // 2) 힌트가 부족하면 기존 로직(내 상세로 판정 → 필요 시 커뮤) 실행
        if (isMine) {
          try {
            const myDetail = await getPostDetail(numId);
            const isDraft = (myDetail as any)?.completedAt == null;
            if (isDraft) await loadMineDraft(numId);
            else await loadCommunity();
          } catch {
            await loadCommunity();
          }
        } else {
          await loadCommunity();
        }
      } catch (err: any) {
        if (!cancelled) {
          setLoadError(parseApiError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    postId,
    detailCtx.viewerId,
    detailCtx.ownerId,
    detailCtx.statusFromList,
    detailCtx.isVisibleFromList,
    detailCtx.summaryIdFromList,
    detailCtx.isMineFromList,
    navigate,
  ]);

  const navigatingRef = useRef(false);

  const goEditWithPrefill = useCallback(async () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;

    closeMenu();

    try {
      const pid = Number(postId);
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
        "수정 화면으로 이동하기 위한 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요."
      );
      navigatingRef.current = false; // 실패 시에만 잠금 해제
    }
  }, [postId, navigate, closeMenu]);

  // 작성자 프로필 클릭
  const handleProfileClick = () => {
    if (!post || post.authorId == null) return;
    navigate(PATH.MYPAGE(String(post.authorId)));
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

  // 댓글 1페이지를 강제 새로고침(작성/삭제 직후 사용)
  const reloadCommentsFirstPage = useCallback(async () => {
    if (!postId) return;
    await loadComments(Number(postId), 1, detailCtx.viewerId ?? null);
  }, [postId, detailCtx.viewerId]);

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
      const mapped = toPostComment(created, detailCtx.viewerId, {
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
      const mapped = toPostComment(created, detailCtx.viewerId, {
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
      const vm = toPostComment(updated, detailCtx.viewerId);
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
      await hardDeletePost(Number(postId));
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
          "삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
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
      <div className="w-full px-4 sm:px-6 md:px-8">
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
    if (viewerIdForCta != null) navigate(PATH.MYPAGE(String(viewerIdForCta)));
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
      <div className="mx-auto flex items-start justify-center gap-6">
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
                  <div className="flex w-full justify-between items-start">
                    <span className="text-head-20-semibold">
                      {post.errorType}
                    </span>
                    {post.isMine && (
                      <div className="relative" ref={menuRef}>
                        <KebabMenuButton
                          onClick={() => setShowMenu(!showMenu)}
                        />
                        {showMenu && (
                          <KebabDropdown
                            options={[
                              {
                                label: "포스트 수정",
                                onClick: () => void goEditWithPrefill(),
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
                  onClick={() => navigate(PATH.MYPAGE(String(post.authorId)))}
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
                    className={`flex px-6 sm:pl-[32px] sm:pr-[31px] py-2 sm:pt-[8px] sm:pb-[12px] justify-center items-center rounded-[100px] text-head-20-semibold text-white transition-colors ${
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
                      loadComments(
                        Number(postId),
                        cPage,
                        detailCtx.viewerId ?? null
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
          className="hidden xl:block h-fit w-[260px] 2xl:w-[320px] sticky"
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
    </div>
  );
}
