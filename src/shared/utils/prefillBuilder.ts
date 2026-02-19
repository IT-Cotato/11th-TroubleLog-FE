import { parseStar } from "./starParser";

export interface DetailContentItem {
  id?: number;
  subTitle?: string | null;
  body?: string | null;
  sequence?: number;
}

/** 상세 API 응답과 호환되는 객체 (필드 선택적, checkListError/Reason은 ViewPostResponse 별칭) */
export interface PostDetailLike {
  title?: string;
  postTags?: string[];
  errorTag?: string | null;
  contents?: DetailContentItem[];
  starRating?: unknown;
  introduction?: string;
  isVisible?: boolean;
  projectId?: number | null;
  thumbnailUrl?: string | null;
  thumbnailImageUrl?: string | null;
  checklistError?: number[];
  checklistReason?: number[];
  checkListError?: number[];
  checkListReason?: number[];
}

export interface FreeformPrefillState {
  editorType: "FREEFORM";
  title: string;
  tags: string[];
  errorType: string | null;
  blocks: Array<{
    id: number;
    title: string;
    content: string;
    isSaved: boolean;
  }>;
  savePrefill: {
    importance: number;
    description: string;
    visibility: "public" | "private";
    projectId: number | null;
    projectName: undefined;
    thumbnail: string | null;
  };
  projectId?: number;
}

export interface TemplatePrefillState {
  editorType: "TEMPLATE";
  title: string;
  tags: string[];
  errorType: string | null;
  blocks: Array<{
    id: number;
    content: string;
    checklist: string[];
    checklistItems: unknown[];
    checklistTitle: string;
    question: string;
    isSaved: boolean;
  }>;
  savePrefill: {
    importance: number;
    description: string;
    visibility: "public" | "private";
    projectId: number | null;
    projectName: undefined;
    thumbnail: string | null;
  };
  projectId?: number;
  checklistError: number[];
  checklistReason: number[];
}

/**
 * 상세 응답 → 자유형식(FREEFORM) 에디터 프리필 state
 */
export function buildFreeformPrefill(detail: PostDetailLike | null | undefined): FreeformPrefillState {
  const contents: DetailContentItem[] = Array.isArray(detail?.contents)
    ? detail.contents
    : [];

  const blocks = contents
    .slice()
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .map((c, i) => ({
      id: c.id ?? i,
      title: c.subTitle ?? "",
      content: c.body ?? "",
      isSaved: false,
    }));

  const thumb = detail?.thumbnailUrl ?? detail?.thumbnailImageUrl ?? null;
  return {
    editorType: "FREEFORM",
    title: detail?.title ?? "",
    tags: detail?.postTags ?? [],
    errorType: detail?.errorTag ?? null,
    blocks,
    savePrefill: {
      importance: parseStar(detail?.starRating),
      description: detail?.introduction ?? "",
      visibility: detail?.isVisible ? "public" : "private",
      projectId: detail?.projectId ?? null,
      projectName: undefined,
      thumbnail: thumb,
    },
    projectId: detail?.projectId ?? undefined,
  };
}

/**
 * 상세 응답 → 템플릿(TEMPLATE) 에디터 프리필 state
 */
export function buildTemplatePrefill(detail: PostDetailLike | null | undefined): TemplatePrefillState {
  const contents: DetailContentItem[] = Array.isArray(detail?.contents)
    ? detail.contents
    : [];

  const blocks = contents
    .slice()
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .map((c, i) => ({
      id: c.id ?? i,
      content: c.body ?? "",
      checklist: [],
      checklistItems: [],
      checklistTitle: c.subTitle ? `${c.subTitle} 체크리스트` : "",
      question: c.subTitle ?? `질문 ${i + 1}`,
      isSaved: false,
    }));

  const thumb = detail?.thumbnailUrl ?? detail?.thumbnailImageUrl ?? null;
  return {
    editorType: "TEMPLATE",
    title: detail?.title ?? "",
    tags: detail?.postTags ?? [],
    errorType: detail?.errorTag ?? null,
    blocks,
    savePrefill: {
      importance: parseStar(detail?.starRating),
      description: detail?.introduction ?? "",
      visibility: detail?.isVisible ? "public" : "private",
      projectId: detail?.projectId ?? null,
      projectName: undefined,
      thumbnail: thumb,
    },
    projectId: detail?.projectId ?? undefined,
    checklistError: Array.isArray(detail?.checklistError)
      ? detail.checklistError
      : Array.isArray(detail?.checkListError)
        ? detail.checkListError
        : [],
    checklistReason: Array.isArray(detail?.checklistReason)
      ? detail.checklistReason
      : Array.isArray(detail?.checkListReason)
        ? detail.checkListReason
        : [],
  };
}
