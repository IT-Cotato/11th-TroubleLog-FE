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

const isMineByUserId = (userId?: number | null) => {
  const me = localStorage.getItem("userId");
  return me != null && String(me) === String(userId ?? "");
};

// 서버 댓글 -> 화면 댓글
export const toPostComment = (
  c: CommunityCommentServerItem
): PostCommentProps => ({
  id: String(c.commentId),
  // 프로필/닉네임 정보가 응답에 없으므로 임시 대체
  name: `사용자 ${c.userId}`,
  profile: undefined,
  date: fmtYYMMDD(c.createdAt),
  content: c.content ?? "",
  isMine: isMineByUserId(c.userId),
  isReply: c.parentCommentId != null,
  parentId: c.parentCommentId != null ? String(c.parentCommentId) : undefined,
});

// 목록 매핑
export const toPostComments = (list: CommunityCommentServerItem[]) =>
  (list ?? []).map(toPostComment);
