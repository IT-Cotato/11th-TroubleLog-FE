import type {
  ViewCombinedResponse,
  GetSummaryResponse,
  PostSummaryContentItem,
} from "@/models/post.model";
import type { CommunityPostDetailProps } from "@/pages/Community/CommunityPostDetail";
import { toPostDetailVM } from "@/mappers/myPostDetail.mapper";

export type TwoPaneDetailVM = {
  header: Pick<
    CommunityPostDetailProps,
    | "errorType"
    | "title"
    | "tags"
    | "date"
    | "isMine"
    | "authorId"
    | "authorProfile"
    | "authorName"
    | "authorFollowers"
    | "authorBio"
    | "isFollowed"
    | "importance"
  >;

  left: {
    questions: string[];
    contents: (string | { type: "image"; src: string; alt?: string })[][];
  };

  right: {
    summaryId?: number;
    summaryType?: string;
    title?: string;
    questions: string[];
    contents: (string | { type: "image"; src: string; alt?: string })[][];
  };
};

function splitBlocks<
  T extends { subTitle: string; body: string; sequence?: number }
>(items: T[] | undefined | null) {
  const sorted = (items ?? [])
    .slice()
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  const questions = sorted.map((c, i) => c.subTitle || `섹션 ${i + 1}`);
  const contents = sorted.map((c) => [c.body ?? ""]);
  return { questions, contents };
}

function mapSummary(
  s:
    | ViewCombinedResponse["postSummaryResDto"]
    | GetSummaryResponse
    | null
    | undefined
) {
  if (!s) {
    return {
      summaryId: undefined,
      summaryType: undefined,
      title: undefined,
      questions: [] as string[],
      contents: [] as any[],
    };
  }
  const items: PostSummaryContentItem[] =
    (s as any).summaryContents ?? (s as any).contents ?? [];
  const { questions, contents } = splitBlocks(items);
  return {
    summaryId: (s as any).summaryId ?? (s as any).id,
    summaryType: (s as any).summaryType ?? (s as any).type,
    title: (s as any).title,
    questions,
    contents,
  };
}

// 합본 → 2열 VM
export function toTwoPaneVM(
  data: ViewCombinedResponse,
  viewerId: number | string | null
): TwoPaneDetailVM {
  const leftVM = toPostDetailVM(data.postResDto as any, viewerId);

  const right = mapSummary(data.postSummaryResDto);

  return {
    header: {
      errorType: leftVM.errorType,
      title: leftVM.title,
      tags: leftVM.tags,
      date: leftVM.date,
      isMine: leftVM.isMine,
      authorId: leftVM.authorId,
      authorProfile: leftVM.authorProfile,
      authorName: leftVM.authorName,
      authorFollowers: leftVM.authorFollowers,
      authorBio: leftVM.authorBio,
      isFollowed: leftVM.isFollowed,
      importance: leftVM.importance,
    },
    left: { questions: leftVM.questions, contents: leftVM.contents },
    right,
  };
}
