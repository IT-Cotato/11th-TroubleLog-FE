import ReportModal from "@/shared/ui/Modal/ReportModal";
import { PostDetailContent } from "./components/PostDetailContent";
import { PostDetailHeader } from "./components/PostDetailHeader";
import { PostDetailComments } from "./components/PostDetailComments";
import { PostDetailSidebar } from "./components/PostDetailSidebar";
import { PATH } from "@/shared/config/paths";
import { useDetailContext } from "@/hooks/useDetailContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { extractIdFromSlug, makePostSlug } from "@/shared/lib/slug";
import { usePostDetail } from "./hooks/usePostDetail";
import { usePostComments } from "./hooks/usePostComments";
import { usePostLike } from "./hooks/usePostLike";
import { usePostMenu } from "./hooks/usePostMenu";
import { usePostNavigation } from "./hooks/usePostNavigation";

export type { CommunityPostDetailProps } from "./types";

export default function CommunityPostDetail() {
  const HEADER_OFFSET = 100;

  // 고정 폭(상단 콘텐츠/본문 공통)
  const CONTENT_WIDTH_CLASS =
    "w-full sm:w-[520px] md:w-[680px] lg:w-[820px] xl:w-[960px]";

  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string) => {
    setToast({ open: true, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast({ open: false, message: "" });
    }, 2000);
  }, []);

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
    onEditError: () => showToast("댓글 수정에 실패했어요."),
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

  const { isLiking, handleToggleLike } = usePostLike({
    effectiveId,
    isCommunitySource,
    isLiked,
    likeCounts,
    setIsLiked,
    setLikeCounts,
  });

  const {
    showMenu,
    setShowMenu,
    deleting,
    reportModalOpen,
    setReportModalOpen,
    reportTarget,
    setReportTarget,
    closeMenu,
    menuRef,
    handleDeletePost,
  } = usePostMenu({
    effectiveId,
    from: detailCtx.from,
    navigate,
  });

  const nav = usePostNavigation({
    effectiveId,
    post,
    setPost,
    navigate,
    closeMenu,
    viewerId: detailCtx.viewerId ?? null,
    headerOffset: HEADER_OFFSET,
  });

  const {
    contentColRef,
    sectionRefs,
    currentSection,
    asideOffset,
    scrollToSection,
    goEditWithPrefill,
    handleProfileClick,
    handleFollow,
    handleUnfollow,
    goBack,
    goCommunity,
    goHome,
    goMyPage,
  } = nav;

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
    if (!isCommunitySource) return;
    const canonical =
      PATH.COMMUNITY_POST_SLUG(
        makePostSlug(post.title, postId ?? effectiveId)
      ) + window.location.search;
    if (!slug || slug !== makePostSlug(post.title, effectiveId)) {
      navigate(canonical, { replace: true });
    }
  }, [post, slug, effectiveId, navigate, postId, isCommunitySource]);

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

  const viewerIdForCta = detailCtx.viewerId;
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
          <PostDetailHeader
            post={post}
            menuRef={menuRef}
            showMenu={showMenu}
            setShowMenu={setShowMenu}
            deleting={deleting}
            onEdit={goEditWithPrefill}
            onDelete={handleDeletePost}
            onReport={() => {
              setShowMenu(false);
              setReportTarget({ type: "post", postId: effectiveId });
              setReportModalOpen(true);
            }}
            onAuthorClick={handleProfileClick}
          />

          <PostDetailContent
            post={post}
            contentWidthClass={CONTENT_WIDTH_CLASS}
            headerOffset={HEADER_OFFSET}
            sectionRefs={sectionRefs}
            onProfileClick={handleProfileClick}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            isCommunitySource={isCommunitySource}
            isLiked={isLiked}
            isLiking={isLiking}
            likeCounts={likeCounts}
            onToggleLike={handleToggleLike}
            onCopyLink={handleCopyLink}
            commentInput={commentInput}
            setCommentInput={setCommentInput}
            onSubmitComment={handleSubmitComment}
            isCommentPosting={isCommentPosting}
          />

          {isCommunitySource && (
            <PostDetailComments
              comments={comments}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReply={handleReply}
              onReport={(commentId) => {
                setReportTarget({ type: "comment", commentId });
                setReportModalOpen(true);
              }}
              onLoadMore={() =>
                loadComments(
                  effectiveId,
                  cPage,
                  detailCtx.viewerId ?? null,
                )
              }
              hasNext={cHasNext && Number.isFinite(effectiveId)}
              loading={cLoading}
            />
          )}
        </div>

        <PostDetailSidebar
          questions={post.questions}
          currentSection={currentSection}
          onSectionClick={scrollToSection}
          headerOffset={HEADER_OFFSET}
          asideOffset={asideOffset}
        />
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
