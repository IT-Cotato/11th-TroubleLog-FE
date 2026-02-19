import PostComment from "@/entities/trouble/ui/PostComment";
import type { PostCommentProps } from "@/entities/trouble/ui/PostComment";

export interface PostDetailCommentsProps {
  comments: PostCommentProps[];
  onEdit: (id: string, newContent: string) => void;
  onDelete: (id: string) => void;
  onReply: (parentId: string, replyContent: string) => void | Promise<void>;
  onReport: (commentId: string) => void;
  onLoadMore: () => void;
  hasNext: boolean;
  loading: boolean;
}

/**
 * 커뮤니티 포스트 상세 댓글 목록 + 더 보기
 */
export function PostDetailComments({
  comments,
  onEdit,
  onDelete,
  onReply,
  onReport,
  onLoadMore,
  hasNext,
  loading,
}: PostDetailCommentsProps) {
  return (
    <div className="flex flex-col items-end self-stretch">
      {comments
        .filter((c) => !c.isReply)
        .map((parent) => (
          <div key={parent.id} className="w-full">
            <PostComment
              {...parent}
              onEdit={(newContent) => onEdit(parent.id, newContent)}
              onDelete={() => onDelete(parent.id)}
              onReply={(replyContent) => onReply(parent.id, replyContent)}
              onReport={onReport}
            />
            {comments
              .filter((c) => c.parentId === parent.id)
              .map((reply) => (
                <PostComment
                  key={reply.id}
                  {...reply}
                  onEdit={(newContent) => onEdit(reply.id, newContent)}
                  onDelete={() => onDelete(reply.id)}
                  onReport={onReport}
                />
              ))}
          </div>
        ))}

      {hasNext && (
        <button
          disabled={loading}
          onClick={onLoadMore}
          className={`mt-4 px-6 py-2 rounded-full text-white ${
            loading ? "bg-gray-300" : "bg-primary"
          }`}
        >
          {loading ? "불러오는 중…" : "댓글 더 보기"}
        </button>
      )}
    </div>
  );
}
