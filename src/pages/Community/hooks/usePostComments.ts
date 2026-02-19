import { useCallback, useState } from "react";
import {
  createCommunityComment,
  getCommunityComments,
  replyCommunityComment,
  softDeleteCommunityComment,
  updateCommunityComment,
} from "@/api/community.api";
import {
  makeOptimisticComment,
  toPostComment,
  toPostComments,
} from "@/entities/trouble/mappers/communityComment.mapper";
import type { PostCommentProps } from "@/entities/trouble/ui/PostComment";
import type { CommunityPostDetailProps } from "@/pages/Community/types";

export interface UsePostCommentsOptions {
  effectiveId: number;
  isCommunitySource: boolean;
  viewerId: number | null;
  setPost: React.Dispatch<React.SetStateAction<CommunityPostDetailProps | null>>;
  /** 댓글 수정 API 실패 시 호출 (에러 토스트 등) */
  onEditError?: () => void;
}

export interface UsePostCommentsReturn {
  commentInput: string;
  setCommentInput: React.Dispatch<React.SetStateAction<string>>;
  comments: PostCommentProps[];
  setComments: React.Dispatch<React.SetStateAction<PostCommentProps[]>>;
  isCommentPosting: boolean;
  cPage: number;
  cHasNext: boolean;
  cLoading: boolean;
  loadComments: (postId: number, page1: number, viewerId: number | null) => Promise<void>;
  reloadCommentsFirstPage: () => Promise<void>;
  /** 상세 로드 시작 시 댓글 상태 초기화 (usePostDetail onLoadStart에서 호출) */
  resetForNewPost: () => void;
  handleSubmitComment: () => Promise<void>;
  handleReply: (parentId: string, replyContent: string) => Promise<void>;
  handleEdit: (id: string, newContent: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
}

/**
 * 커뮤니티 포스트 댓글 로드·작성·수정·삭제 로직
 */
export function usePostComments(
  options: UsePostCommentsOptions
): UsePostCommentsReturn {
  const { effectiveId, isCommunitySource, viewerId, setPost, onEditError } = options;

  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<PostCommentProps[]>([]);
  const [isCommentPosting, setIsCommentPosting] = useState(false);
  const [cPage, setCPage] = useState(1);
  const [cHasNext, setCHasNext] = useState(false);
  const [cLoading, setCLoading] = useState(false);

  const loadComments = useCallback(
    async (postId: number, page1: number, currentViewerId: number | null) => {
      setCLoading(true);
      try {
        const resp = await getCommunityComments(postId, page1, 10);
        const mapped = toPostComments(resp.content, currentViewerId);
        setComments((prev) => (page1 === 1 ? mapped : [...prev, ...mapped]));
        setCPage(typeof resp.page === "number" ? resp.page + 1 : page1 + 1);
        setCHasNext(!!resp.hasNext);
        setPost((prev) =>
          prev
            ? { ...prev, commentCounts: resp.totalElements ?? prev.commentCounts }
            : prev
        );
      } finally {
        setCLoading(false);
      }
    },
    [setPost]
  );

  const reloadCommentsFirstPage = useCallback(async () => {
    if (!Number.isFinite(effectiveId)) return;
    await loadComments(effectiveId, 1, viewerId);
  }, [effectiveId, viewerId, loadComments]);

  const resetForNewPost = useCallback(() => {
    setComments([]);
    setCPage(1);
    setCHasNext(false);
  }, []);

  const handleSubmitComment = useCallback(async () => {
    if (!Number.isFinite(effectiveId) || !isCommunitySource) return;
    const contents = commentInput.trim();
    if (!contents || isCommentPosting) return;

    setIsCommentPosting(true);
    const optimistic = makeOptimisticComment({ contents });
    setComments((prev) => [optimistic, ...prev]);
    setPost((p) => (p ? { ...p, commentCounts: (p.commentCounts ?? 0) + 1 } : p));
    setCommentInput("");

    try {
      const created = await createCommunityComment(effectiveId, { contents });
      const mapped = toPostComment(created, viewerId, { isReply: false });
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
  }, [
    effectiveId,
    isCommunitySource,
    commentInput,
    isCommentPosting,
    viewerId,
    setPost,
    reloadCommentsFirstPage,
  ]);

  const handleReply = useCallback(
    async (parentId: string, replyContent: string) => {
      if (!Number.isFinite(effectiveId) || !isCommunitySource) return;
      const contents = replyContent.trim();
      if (!contents) return;

      const optimistic = makeOptimisticComment({ contents, parentId });
      setComments((prev) => [...prev, optimistic]);

      try {
        const created = await replyCommunityComment(
          effectiveId,
          Number(parentId),
          { contents }
        );
        const mapped = toPostComment(created, viewerId, {
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
    },
    [effectiveId, isCommunitySource, viewerId, reloadCommentsFirstPage]
  );

  const handleEdit = useCallback(
    async (id: string, newContent: string) => {
      if (!Number.isFinite(effectiveId) || !isCommunitySource) return;
      const cid = Number(id);
      try {
        const updated = await updateCommunityComment({
          postId: effectiveId,
          commentId: cid,
          contents: newContent,
        });
        const vm = toPostComment(updated, viewerId);
        setComments((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, content: vm.content, date: vm.date } : c
          )
        );
      } catch {
        onEditError?.();
      }
    },
    [effectiveId, isCommunitySource, viewerId, onEditError]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!isCommunitySource) return;
      try {
        await softDeleteCommunityComment(Number(id));
        setComments((prev) => prev.filter((c) => c.id !== id));
        setPost((prev) =>
          prev
            ? { ...prev, commentCounts: Math.max(0, prev.commentCounts - 1) }
            : prev
        );
      } catch {
        // ignore
      }
    },
    [isCommunitySource, setPost]
  );

  return {
    commentInput,
    setCommentInput,
    comments,
    setComments,
    isCommentPosting,
    cPage,
    cHasNext,
    cLoading,
    loadComments,
    reloadCommentsFirstPage,
    resetForNewPost,
    handleSubmitComment,
    handleReply,
    handleEdit,
    handleDelete,
  };
}
