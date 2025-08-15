import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "./axios";
import type {
  CommunityCommentServerItem,
  CommunityLikeResult,
  CommunityPostDetailServer,
  CommunitySort,
  CreateCommentBody,
  GetCommunityCommentsResponse,
  GetCommunityListResponse,
} from "@/types/community.model";

// 중복 호출 방지용 (dev StrictMode 대비)
const inflightDetail = new Map<
  number,
  Promise<CommunityPostDetailServer | null>
>();
const inflightComments = new Map<
  string,
  Promise<GetCommunityCommentsResponse>
>();
const inflightLike = new Map<number, Promise<CommunityLikeResult>>();

// 커뮤니티 포스트 목록
export const getCommunityList = (
  page0 = 0,
  size = 12,
  sortBy: CommunitySort = "latest"
) =>
  getAPIResponseData<GetCommunityListResponse>(
    api.get<GetCommunityListResponse>("/community/list", {
      params: {
        page: Math.max(1, page0 + 1),
        size,
        sortBy,
      },
    })
  );

// 커뮤니티 포스트 상세 조회
export function getCommunityPostDetail(postId: number) {
  if (!inflightDetail.has(postId)) {
    const p = getAPIResponseData<CommunityPostDetailServer | null>({
      url: `/community/${postId}`,
      method: "GET",
    }).finally(() => setTimeout(() => inflightDetail.delete(postId), 0));
    inflightDetail.set(postId, p);
  }
  return inflightDetail.get(postId)!;
}

// 댓글 목록 조회
export function getCommunityComments(postId: number, page1 = 1, size = 10) {
  const key = `c:${postId}:${page1}:${size}`;
  if (!inflightComments.has(key)) {
    const p = getAPIResponseData<GetCommunityCommentsResponse>(
      api.get<GetCommunityCommentsResponse>(`/community/${postId}/comments`, {
        params: { page: Math.max(1, page1), size },
      })
    ).finally(() => {
      setTimeout(() => inflightComments.delete(key), 0);
    });
    inflightComments.set(key, p);
  }
  return inflightComments.get(key)!;
}

// 포스트 좋아요
export const likeCommunityPost = (postId: number) => {
  if (!inflightLike.has(postId)) {
    const p = getAPIResponseData<CommunityLikeResult>(
      api.post(`/community/${postId}/like`)
    ).finally(() => setTimeout(() => inflightLike.delete(postId), 0));
    inflightLike.set(postId, p);
  }
  return inflightLike.get(postId)!;
};

// 포스트 좋아요 취소
export async function unlikeCommunityPost(postId: number): Promise<void> {
  await api.delete(`/community/${postId}/like`);
}

// 댓글 생성
export const createCommunityComment = (
  postId: number,
  body: CreateCommentBody
) =>
  getAPIResponseData<CommunityCommentServerItem>({
    url: `/community/${postId}/comment`,
    method: "POST",
    data: body,
  });

// 대댓글 생성
export const replyCommunityComment = (
  postId: number,
  commentId: number,
  body: CreateCommentBody
) =>
  getAPIResponseData<CommunityCommentServerItem>({
    url: `/community/${postId}/${commentId}`,
    method: "POST",
    data: body,
  });
