// ===== 리터럴 타입들
export const SUMMARY_TYPES = [
  "NONE",
  "RESUME",
  "BLOG",
  "INTERVIEW",
  "ISSUE_MANAGEMENT",
] as const;
export type SummaryTypeParam = (typeof SUMMARY_TYPES)[number];

export type UiTagCategory =
  | "프론트엔드"
  | "백엔드"
  | "데브옵스"
  | "인프라"
  | "데이터베이스"
  | "기타";

export type ApiTagCategory =
  | "FRONTEND"
  | "BACKEND"
  | "DEVOPS"
  | "INFRA"
  | "DATABASE"
  | "TOOL";

// ===== 공통 블록
export interface PostBasicFields {
  title: string;
  postTags: string[];
  introduction: string;
  isVisible: boolean;
  isSummaryCreated: boolean;
  postStatus: string;
  starRating: string;
  templateType: string;
  thumbnailImageUrl?: string;
}

export interface PostServerMeta {
  id: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  completedAt: string | null;
  userId: number;
  projectId: number;
}

// Dto with id
export interface PostContent {
  id: number;
  subTitle: string;
  body: string;
  sequence: number;
  authorType: string;
  summaryType: SummaryTypeParam;
}

// Dto without id
export interface PostContentDto {
  subTitle: string;
  body: string;
  sequence: number;
  authorType: string;
  summaryType: SummaryTypeParam;
}

// ===== 응답/요청

// 원본 문서 상세 조회
export interface ViewPostResponse extends PostBasicFields, PostServerMeta {
  isDeleted: boolean;
  errorTag: string;
  contents: PostContent[];
}

// 원본 문서 생성/수정
export interface CreatePostRequest extends PostBasicFields {
  errorTagName: string;
  contentDtoList: PostContentDto[];
  projectId: number;
}
export interface CreatePostResponse extends PostBasicFields, PostServerMeta {
  isDeleted: boolean;
  errorTag: string;
  contents: PostContent[];
}

export interface EditPostRequest extends PostBasicFields {
  errorTagName: string;
  contentDtoList: PostContentDto[];
  projectId: number;
}
export interface EditPostResponse extends PostBasicFields, PostServerMeta {
  isDeleted: boolean;
  errorTag: string;
  contents: PostContent[];
}

// 요약본 상세 조회
export interface GetSummaryResponse extends PostBasicFields, PostServerMeta {
  isDeleted: boolean;
  errorTag: string;
  contents: PostContent[];
}
export interface GetSummaryParams {
  type: SummaryTypeParam;
}

// 요약 작업 시작/상태
export interface WaitLoadingRequest {
  type: SummaryTypeParam;
}
export interface StartLoadingResponse {
  taskId: string;
  userId: number;
  status: string;
  message: string;
  createdAt: string;
}
export interface WaitLoadingResponse {
  taskId: string;
  userId: number;
  status: string;
  message: string;
  progress: number;
  result: PostContentDto | null;
  createdAt: string;
  completedAt: string | null;
}

// 원본 문서 복구/통합 조회
export interface RestorePostResponse extends PostBasicFields, PostServerMeta {
  isDeleted: boolean;
  errorTag: string;
  contents: PostContent[];
}
export interface ViewCombinedResponse extends PostBasicFields, PostServerMeta {
  isDeleted: boolean;
  errorTag: string;
  contents: PostContent[];
}

// 태그 조회
export type TagsByCategoryResponse = string[];
export type TagsByKeywordResponse = string[];
export interface GetTagsByCategoryParams {
  tagCategory: ApiTagCategory;
}
export interface GetTagsByKeywordParams {
  tagName: string;
}

// 리스트/검색
export interface PostListItem {
  id: number;
  title: string;
  introduction: string;
  postTags: string[];
  starRating: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  postStatus: string;
  isVisible: boolean;
  isSummaryCreated: boolean;
  thumbnailImageUrl?: string;
}
export interface PagedResponse {
  content: string[];
  hasNext: boolean;
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface SearchPostsParams {
  keyword: string;
  page?: number;
  size?: number;
}

export type SearchMyPostsParams = SearchPostsParams;
export type SearchPostByKeywordResponse = PagedResponse;
export type SearchMyPostByKeywordResponse = PagedResponse;
