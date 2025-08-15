import type {
  CommunityPostDetailServer,
  CommunityUserInfoDetail,
} from "@/types/community.model";
import type { CommunityPostDetailProps } from "@/pages/Community/CommunityPostDetail";

const toYY = (d: string) => {
  if (!d) return "";
  const [yyyy, mm, dd] = d.split(".");
  return yyyy && mm && dd ? `${yyyy.slice(2)}.${mm}.${dd}` : d;
};

const isMineByUser = (author: CommunityUserInfoDetail) => {
  const me = localStorage.getItem("userId");
  return !!(me && String(author.userId) === String(me));
};

export function toCommunityPostVM(
  src: CommunityPostDetailServer
): CommunityPostDetailProps {
  const isMine = isMineByUser(src.userInfoResDto);
  const sorted = [...(src.contents ?? [])].sort(
    (a, b) => a.sequence - b.sequence
  );

  return {
    errorType: src.errorTag ?? "",
    title: src.title ?? "",
    tags: src.postTags ?? [],
    date: toYY(src.completedAt ?? ""),
    isMine,
    authorProfile: src.userInfoResDto.profileUrl ?? undefined,
    authorName: src.userInfoResDto.nickname ?? "",
    authorFollowers: src.userInfoResDto.followerNum ?? 0,
    authorBio: src.userInfoResDto.bio ?? "",
    importance: 0,
    questions: sorted.map((c, i) => c.subTitle || `섹션 ${i + 1}`),
    contents: sorted.map((c) => [c.body || ""]),
    isLiked: false,
    likeCounts: src.likeCount ?? 0,
    commentCounts: src.commentCount ?? 0,
    comments: [],
  };
}
