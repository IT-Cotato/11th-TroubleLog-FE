import type { CommunityCommentServerItem } from "@/types/community.model";
import type { PostCommentProps } from "@/components/Community/PostComment";

const fmtYYMMDD = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

const isMine = (
  userId: number | null | undefined,
  viewerId: number | string | null
) => viewerId != null && String(viewerId) === String(userId ?? "");

// 서버 댓글 -> 화면 댓글
export const toPostComment = (
  c: CommunityCommentServerItem,
  viewerId: number | string | null,
  override?: Partial<
    Pick<PostCommentProps, "isReply" | "parentId" | "name" | "profile">
  >
): PostCommentProps => {
  const base: PostCommentProps = {
    id: String(c.commentId),
    // 프로필/닉네임 정보가 응답에 없으므로 임시 대체
    name: c.name ?? "(알 수 없음)",
    profile: c.profileImg ?? undefined,
    date: fmtYYMMDD(c.createdAt),
    content: c.content ?? "",
    isMine: isMine(c.userId, viewerId),
    isReply: c.parentCommentId != null,
    parentId: c.parentCommentId != null ? String(c.parentCommentId) : undefined,
  };
  return { ...base, ...override };
};

// 목록 매핑
export const toPostComments = (
  list: CommunityCommentServerItem[],
  viewerId: number | string | null,
  overrides?: Record<
    number,
    Partial<Pick<PostCommentProps, "isReply" | "parentId" | "name" | "profile">>
  >
) =>
  (list ?? []).map((c) => toPostComment(c, viewerId, overrides?.[c.commentId]));

// 낙관적(optimistic) 댓글/대댓글 생성용 헬퍼
export const makeOptimisticComment = (args: {
  contents: string;
  parentId?: string; // 있으면 대댓글
}) => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const id = `tmp-${Date.now()}`;

  const comment: PostCommentProps = {
    id,
    name: "나",
    profile: undefined,
    date: `${yy}.${mm}.${dd}`,
    content: args.contents,
    isMine: true,
    isReply: !!args.parentId,
    parentId: args.parentId,
  };
  return comment;
};
