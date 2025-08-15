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
import getAPIResponseData from "../utils/getAPIResponseData";

// 원본 문서 상세 조회
export const getPostDetail = (postId: number) =>
  getAPIResponseData<ViewPostResponse>({
    url: `/troubles/${postId}`,
    method: "GET",
  });

// 원본 문서 생성 --done
export const createPost = (body: CreatePostRequest) =>
  getAPIResponseData<CreatePostResponse>({
    url: "/troubles",
    method: "POST",
    data: body,
  });

// 원본 문서 수정
export const editPost = (postId: number, body: EditPostRequest) =>
  getAPIResponseData<EditPostResponse>({
    url: `/troubles/${postId}`,
    method: "PUT",
    data: body,
  });

// 원본 문서 임시 삭제 --done
export const deletePost = (postId: number) =>
  getAPIResponseData<void>({
    url: `/troubles/${postId}`,
    method: "DELETE",
  });

// 원본 문서 복구
export const restorePost = (postId: number) =>
  getAPIResponseData<RestorePostResponse>({
    url: `/troubles/${postId}/restore`,
    method: "POST",
  });

// 요약본 상세 조회
export const getPostSummary = (postId: number, params: GetSummaryParams) =>
  getAPIResponseData<GetSummaryResponse>({
    url: `/troubles/${postId}/summary`,
    method: "GET",
    params,
  });

// 요약 작업 시작 -- done
export const startSummary = (postId: number, body: WaitLoadingRequest) =>
  getAPIResponseData<StartLoadingResponse>({
    url: `/troubles/${postId}/summary`,
    method: "POST",
    data: body,
  });

// 요약 작업 상태 조회 -- done
export const getSummaryStatus = (postId: number, taskId: string) =>
  getAPIResponseData<WaitLoadingResponse>({
    url: `/troubles/${postId}/summary/${taskId}`,
    method: "GET",
  });

// 요약 작업 취소 -- done
export const cancelSummary = (postId: number, taskId: string) =>
  getAPIResponseData<void>({
    url: `/troubles/${postId}/summary/${taskId}`,
    method: "DELETE",
  });

// 원본+요약본 상세 조회
export const getCombinedDetail = (postId: number) =>
  getAPIResponseData<ViewCombinedResponse>({
    url: `/troubles/${postId}/combine`,
    method: "GET",
  });

// 기술 태그 조회 - 키워드 --done
export const getTagsByKeyword = (params: GetTagsByKeywordParams) =>
  getAPIResponseData<TagsByKeywordResponse>({
    url: "/troubles/tags",
    method: "GET",
    params,
  });

// 기술 태그 조회 - 카테고리 --done
export const getTagsByCategory = (params: GetTagsByCategoryParams) =>
  getAPIResponseData<TagsByCategoryResponse>({
    url: "/troubles/tags/category",
    method: "GET",
    params,
  });

// 문서 검색
export const searchPostsByKeyword = (params: SearchPostsParams) =>
  getAPIResponseData<SearchPostByKeywordResponse>({
    url: "/troubles/search",
    method: "GET",
    params,
  });

// 내 문서 검색
export const searchMyPostsByKeyword = (params: SearchMyPostsParams) =>
  getAPIResponseData<SearchMyPostByKeywordResponse>({
    url: "/troubles/my",
    method: "GET",
    params,
  });
