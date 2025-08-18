export const SUMMARY_TYPES = [
  "NONE",
  "RESUME",
  "BLOG",
  "INTERVIEW",
  "ISSUE_MANAGEMENT",
] as const;
export type SummaryTypeParam = (typeof SUMMARY_TYPES)[number];

// 요청용 기본 필드 (create/edit)
export interface PostBasicReqFields {
  title: string;
  postTags: string[];
  introduction: string;
  isVisible: boolean;
  isSummaryCreated: boolean;
  postStatus: string;
  starRating: number;
  templateType: string;
  thumbnailImageUrl?: string;
}

// 응답용 기본 필드 (detail/list)
export interface PostBasicResFields {
  title: string;
  postTags: string[];
  introduction: string;
  isVisible: boolean;
  isSummaryCreated: boolean;
  postStatus: string;
  starRating: number;
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

// 컨텐츠(요약 분리 이후)
export interface PostContent {
  id: number;
  subTitle: string;
  body: string;
  sequence: number;
}
export interface PostContentDto {
  subTitle: string;
  body: string;
  sequence: number;
}

// 상세 응답(원본)
export interface ViewPostResponse extends PostBasicResFields, PostServerMeta {
  isDeleted: boolean;
  errorTag: string;
  contents: PostContent[];
  checkListError: number[];
  checkListReason: number[];
}

// 생성/수정
export interface CreatePostRequest extends PostBasicReqFields {
  errorTagName: string;
  contentDtoList: PostContentDto[];
  projectId: number;
  checklistError: number[];
  checklistReason: number[];
}
export type CreatePostResponse = ViewPostResponse;
export type EditPostRequest = CreatePostRequest;
export type EditPostResponse = ViewPostResponse;

// 요약 컨테이너
export interface PostSummary {
  id: number;
  type: SummaryTypeParam;
  contents: PostContent[];
  createdAt: string;
  updatedAt: string;
}

// 요약 작업
// 시작은 query ?summaryType= 으로 보냄(Req body 불필요)
export interface StartLoadingResponse {
  taskId: string;
  userId: number;
  status: string;
  currentStep: string;
  createdAt: string;
}
export interface WaitLoadingResponse {
  taskId: string;
  userId: number;
  postSummaryId: number; // 스웨거에 있음
  status: string;
  currentStep: string;
  progress: number; // 0..100
  result: unknown; // 스펙상 object (초안 구조 확정 전이라 any/unknown
  createdAt: string;
  completedAt: string | null;
}

// 합본 상세
export interface ViewCombinedResponse {
  postResDto: ViewPostResponse;
  postSummaryResDto: PostSummary | null;
}

// 태그
export type TagsByCategoryResponse = string[];
export type TagsByKeywordResponse = string[];
export interface GetTagsByCategoryParams {
  tagCategory:
    | "FRONTEND"
    | "BACKEND"
    | "DEVOPS"
    | "INFRA"
    | "DATABASE"
    | "TOOL";
}
export interface GetTagsByKeywordParams {
  tagName: string;
}

// 리스트/검색
export interface PostListItem extends PostBasicResFields {
  id: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
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
export type SearchPostByKeywordResponse = PagedResponse<PostListItem>;
export type SearchMyPostByKeywordResponse = PagedResponse<PostListItem>;

// 복구 응답
export interface RestorePostResponse
  extends PostBasicResFields,
    PostServerMeta {
  isDeleted: boolean;
  errorTag: string;
  contents: PostContent[];
}

//////// 요약본 전용
export interface PostSummaryContentItem {
  id: number;
  subTitle: string;
  body: string;
  sequence: number;
}

// 서버 응답 스키마에 맞춘 타입 (Swagger 기준)
export interface GetSummaryResponse {
  summaryId: number;
  postId: number;
  title: string;
  userId: number;
  projectId: number;
  summaryType: SummaryTypeParam | "SHORT"; // 서버 예시에 SHORT가 있어 여유있게
  errorTag: string;
  postTags: string[];
  summaryContents: PostSummaryContentItem[];
  summaryCreatedAt: string;
}
