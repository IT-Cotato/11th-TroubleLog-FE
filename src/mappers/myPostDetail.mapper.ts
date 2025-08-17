import type { CommunityPostDetailProps } from "@/pages/Community/CommunityPostDetail";

// getPostDetail의 data 형태(래퍼 제거 후)
export type PostDetailServer = {
  id: number;
  title: string;
  introduction: string | null;
  likeCount: number;
  commentCount: number;
  isVisible: boolean;
  isSummaryCreated: boolean;
  isDeleted: boolean;
  postStatus: string;
  starRating: string | number;
  checklistError: string[];
  checklistReason: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  deletedAt: string | null;
  userId: number;
  projectId: number;
  errorTag: string;
  postTags: string[];
  contents: Array<{
    id: number;
    subTitle: string;
    body: string;
    sequence: number;
    authorType: "USER_WRITTEN" | string;
    summaryType: "NONE" | string;
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
  const isMine = viewerId != null && String(src.userId) === String(viewerId);
  const sorted = [...(src.contents ?? [])].sort(
    (a, b) => (a?.sequence ?? 0) - (b?.sequence ?? 0)
  );

  return {
    errorType: src.errorTag ?? "",
    title: src.title ?? "",
    tags: src.postTags ?? [],
    date: isoToYYMMDD(src.updatedAt || src.createdAt),
    isMine,
    authorId: src.userId,
    authorProfile: undefined,
    authorName: "",
    authorFollowers: 0,
    authorBio: "",
    importance: starToNumber(src.starRating),
    questions: sorted.map((c, i) => c?.subTitle || `섹션 ${i + 1}`),
    contents: sorted.map((c) => [c?.body || ""]),
    isLiked: false,
    likeCounts: src.likeCount ?? 0,
    commentCounts: src.commentCount ?? 0,
    comments: [],
  };
}
