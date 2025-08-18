import type { CommunityPostDetailProps } from "@/pages/Community/CommunityPostDetail";

// getPostDetail의 data 형태(래퍼 제거 후)
export type PostDetailServer = {
  userInfoResDto?: {
    userId: number;
    nickname: string;
    profileUrl: string | null;
    bio: string | null;
    followerNum: number;
    followingNum: number;
    isFollowed: boolean;
  } | null;

  id: number;
  title: string;
  introduction: string | null;

  likeCount: number;
  commentCount: number;
  liked?: boolean | null;

  isSummaryCreated: boolean;
  postStatus: string;
  starRating: number | string;
  templateType?: "FREE_FORM" | "GUIDELINE" | string;

  checklistError: number[];
  checklistReason: number[];

  createdAt: string;
  updatedAt: string;
  completedAt: string | null;

  errorTag: string;
  postTags: string[];

  contents: Array<{
    id: number;
    subTitle: string;
    body: string;
    sequence: number;
  }>;

  thumbnailUrl?: string | null;
};

// ISO -> "YY.MM.DD"
const isoToYYMMDD = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
};

// 별점 enum/숫자 -> 정수(0~5)
const starToNumber = (v: string | number | undefined): number => {
  if (typeof v === "number") return Math.max(0, Math.min(5, v));
  switch (String(v || "").toUpperCase()) {
    case "ONE_STAR":
    case "ONE_STARS":
    case "ONE":
      return 1;
    case "TWO_STARS":
    case "TWO":
      return 2;
    case "THREE_STARS":
    case "THREE":
      return 3;
    case "FOUR_STARS":
    case "FOUR":
      return 4;
    case "FIVE_STARS":
    case "FIVE":
      return 5;
    default:
      return 0;
  }
};

// getPostDetail(data) -> CommunityPostDetailProps
export function toPostDetailVM(
  src: PostDetailServer,
  viewerId: number | string | null
): CommunityPostDetailProps {
  const author = src.userInfoResDto ?? null;
  const authorId = author?.userId;

  const isMine =
    viewerId != null &&
    authorId != null &&
    String(authorId) === String(viewerId);

  const sorted = [...(src.contents ?? [])].sort(
    (a, b) => (a?.sequence ?? 0) - (b?.sequence ?? 0)
  );

  return {
    errorType: src.errorTag ?? "",
    title: src.title ?? "",
    tags: src.postTags ?? [],
    date: isoToYYMMDD(src.updatedAt || src.createdAt),

    isMine,
    authorId: authorId ?? 0,
    authorProfile: author?.profileUrl ?? undefined,
    authorName: author?.nickname ?? "",
    authorFollowers: author?.followerNum ?? 0,
    authorBio: author?.bio ?? "",

    importance: starToNumber(src.starRating),

    questions: sorted.map((c, i) => c?.subTitle || `섹션 ${i + 1}`),
    contents: sorted.map((c) => [c?.body || ""]),

    isLiked: !!src.liked,
    likeCounts: src.likeCount ?? 0,
    commentCounts: src.commentCount ?? 0,
    comments: [],

    isFollowed: author?.isFollowed ?? false,
  };
}
