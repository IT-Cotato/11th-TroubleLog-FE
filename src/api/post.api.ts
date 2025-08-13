import instance from "./axios";
import type {
  ViewPostResponse,
  CreatePostRequest,
  CreatePostResponse,
  EditPostRequest,
  EditPostResponse,
  RestorePostResponse,
  GetSummaryParams,
  GetSummaryResponse,
  WaitLoadingRequest,
  StartLoadingResponse,
  WaitLoadingResponse,
  ViewCombinedResponse,
  TagsByCategoryResponse,
  TagsByKeywordResponse,
  GetTagsByCategoryParams,
  GetTagsByKeywordParams,
  SearchPostsParams,
  SearchMyPostsParams,
  SearchPostByKeywordResponse,
  SearchMyPostByKeywordResponse,
} from "@/models/post.model";

// 원본 문서 상세 조회
export const getPostDetail = (postId: number) =>
  instance.get<ViewPostResponse>(`/troubles/${postId}`);

// 원본 문서 생성 --done
export const createPost = (body: CreatePostRequest) =>
  instance.post<CreatePostResponse>("/troubles", body);

// 원본 문서 수정
export const editPost = (postId: number, body: EditPostRequest) =>
  instance.put<EditPostResponse>(`/troubles/${postId}`, body);

// 원본 문서 임시 삭제
export const deletePost = (postId: number) =>
  instance.delete<void>(`/troubles/${postId}`);

// 원본 문서 복구
export const restorePost = (postId: number) =>
  instance.post<RestorePostResponse>(`/troubles/${postId}/restore`);

// 요약본 상세 조회
export const getPostSummary = (postId: number, params: GetSummaryParams) =>
  instance.get<GetSummaryResponse>(`/troubles/${postId}/summary`, { params });

// 요약 작업 시작 -- done
export const startSummary = (postId: number, body: WaitLoadingRequest) =>
  instance.post<StartLoadingResponse>(`/troubles/${postId}/summary`, body);

// 요약 작업 상태 조회 -- done
export const getSummaryStatus = (postId: number, taskId: string) =>
  instance.get<WaitLoadingResponse>(`/troubles/${postId}/summary/${taskId}`);

// 요약 작업 취소 -- done
export const cancelSummary = (postId: number, taskId: string) =>
  instance.delete<void>(`/troubles/${postId}/summary/${taskId}`);

// 원본+요약본 상세 조회
export const getCombinedDetail = (postId: number) =>
  instance.get<ViewCombinedResponse>(`/troubles/${postId}/combine`, {});

// 기술 태그 조회 - 키워드 --done
export const getTagsByKeyword = (params: GetTagsByKeywordParams) =>
  instance.get<TagsByKeywordResponse>("/troubles/tags", { params });

// 기술 태그 조회 - 카테고리 --done
export const getTagsByCategory = (params: GetTagsByCategoryParams) =>
  instance.get<TagsByCategoryResponse>("/troubles/tags/category", { params });

// 문서 검색
export const searchPostsByKeyword = (params: SearchPostsParams) =>
  instance.get<SearchPostByKeywordResponse>("/troubles/search", { params });

// 내 문서 검색
export const searchMyPostsByKeyword = (params: SearchMyPostsParams) =>
  instance.get<SearchMyPostByKeywordResponse>("/troubles/my", { params });
