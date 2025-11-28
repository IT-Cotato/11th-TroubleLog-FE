import type {
  ViewPostResponse,
  CreatePostRequest,
  CreatePostResponse,
  EditPostRequest,
  EditPostResponse,
  RestorePostResponse,
  StartLoadingResponse,
  WaitLoadingResponse,
  ViewCombinedResponse,
  TagsByCategoryResponse,
  TagsByKeywordResponse,
  GetTagsByCategoryParams,
  GetTagsByKeywordParams,
  SearchPostsParams,
  SearchMyPostsParams,
  SummaryTypeParam,
  SearchPostByKeywordResponse,
  SearchMyPostByKeywordResponse,
  GetSummaryResponse,
} from "@/models/post.model";
import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "./axios";
import type { AxiosRequestConfig } from "axios";

const inflightMineDetail = new Map<number, Promise<any>>();

// 상세
export function getPostDetail(postId: number) {
  if (!inflightMineDetail.has(postId)) {
    const p = getAPIResponseData<ViewPostResponse>(
      api.get(`/troubles/${postId}`)
    ).finally(() => {
      setTimeout(() => inflightMineDetail.delete(postId), 800); // 짧은 TTL
    });
    inflightMineDetail.set(postId, p);
  }
  return inflightMineDetail.get(postId)!;
}

// 생성
export const createPost = (body: CreatePostRequest) =>
  getAPIResponseData<CreatePostResponse>({
    url: "/troubles",
    method: "POST",
    data: body,
  });

// 수정
export const editPost = (postId: number, body: EditPostRequest) =>
  getAPIResponseData<EditPostResponse>({
    url: `/troubles/${postId}`,
    method: "PATCH",
    data: body,
  });

// 영구 삭제 (스웨거: DELETE /troubles/{postId})
export const hardDeletePost = (postId: number) =>
  getAPIResponseData<void>({
    url: `/troubles/${postId}`,
    method: "DELETE",
  });

// 임시 삭제 (Deprecated: DELETE /troubles/{postId}/soft)
export const softDeletePost = (postId: number) =>
  getAPIResponseData<void>({
    url: `/troubles/${postId}/soft`,
    method: "DELETE",
  });

// 복구 (Deprecated지만 제공됨)
export const restorePost = (postId: number) =>
  getAPIResponseData<RestorePostResponse>({
    url: `/troubles/${postId}/restore`,
    method: "POST",
  });

// 요약 작업 시작 — query로 summaryType 전달
export const startSummary = (postId: number, summaryType: SummaryTypeParam) =>
  getAPIResponseData<StartLoadingResponse>({
    url: `/troubles/${postId}/summary`,
    method: "POST",
    params: { summaryType },
  });

// 요약 작업 상태
export const getSummaryStatus = (
  postId: number,
  taskId: string,
  cfg?: AxiosRequestConfig
) =>
  getAPIResponseData<WaitLoadingResponse>({
    url: `/troubles/${postId}/summary/${taskId}`,
    method: "GET",
    __skipGlobalAuthGuard: true,
    ...(cfg || {}),
  });

// 요약 작업 취소
export const cancelSummary = (postId: number, taskId: string) =>
  getAPIResponseData<void>({
    url: `/troubles/${postId}/summary/${taskId}`,
    method: "DELETE",
  });

// 요약본 상세 (summaryId로 조회)
export const getPostSummary = (summaryId: number) =>
  getAPIResponseData<GetSummaryResponse>({
    url: `/troubles/summary/${summaryId}`,
    method: "GET",
  });

// 요약본 영구 삭제
export const hardDeleteSummary = (summaryId: number) =>
  getAPIResponseData<void>({
    url: `/troubles/summary/${summaryId}`,
    method: "DELETE",
  });

// 합본 상세 (postId + summaryId)
export const getCombinedDetail = (postId: number, summaryId: number) =>
  getAPIResponseData<ViewCombinedResponse>({
    url: `/troubles/${postId}/combine/${summaryId}`,
    method: "GET",
  });

// 태그
export const getTagsByKeyword = (params: GetTagsByKeywordParams) =>
  getAPIResponseData<TagsByKeywordResponse>({
    url: "/troubles/tags",
    method: "GET",
    params,
  });

export const getTagsByCategory = (params: GetTagsByCategoryParams) =>
  getAPIResponseData<TagsByCategoryResponse>({
    url: `/troubles/tags/category`,
    method: "GET",
    params,
  });

// 검색
export const searchPostsByKeyword = (params: SearchPostsParams) =>
  getAPIResponseData<SearchPostByKeywordResponse>({
    url: "/troubles/search",
    method: "GET",
    params,
  });

export const searchMyPostsByKeyword = (params: SearchMyPostsParams) =>
  getAPIResponseData<SearchMyPostByKeywordResponse>({
    url: "/troubles/my/search",
    method: "GET",
    params,
  });
