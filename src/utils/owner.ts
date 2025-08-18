export type PostCardUserInfo = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
} | null;

export function getOwnerIdFromCard(item: {
  postCardUserInfoResDto: PostCardUserInfo;
}): number | undefined {
  return item.postCardUserInfoResDto?.userId ?? undefined;
}
export function getAuthorNameFromCard(item: {
  postCardUserInfoResDto: PostCardUserInfo;
}): string {
  return item.postCardUserInfoResDto?.nickname ?? "알 수 없음";
}
export function getAuthorProfileFromCard(item: {
  postCardUserInfoResDto: PostCardUserInfo;
}): string | null {
  return item.postCardUserInfoResDto?.profileImageUrl ?? null;
}
