import type { PaginatedResponse } from "@/types/common.model";
import type { TroubleContentBlock } from "./troubles.server";

export type CommunitySort = "latest" | "likes";

export interface CommunityServerCard {
  postCardUserInfoResDto?: {
    userId: number;
    nickname: string;
    profileImageUrl: string | null;
  } | null;
  userInfo?: {
    userId: number;
    nickname: string;
    profileImageUrl: string | null;
  } | null;
  id: number;
  title: string;
  thumbnailUrl: string | null;
  completedAt?: string;
  createdAt?: string;
  errorTag: string | null;
  postTags: string[];
  likeCount: number;
  commentCount: number;
}

export type GetCommunityListResponse = PaginatedResponse<CommunityServerCard>;

// 커뮤니티 게시글 상세 응답
export interface CommunityUserInfoDetail {
  userId: number;
  nickname: string;
  profileUrl: string | null;
  bio: string | null;
  followerNum: number;
  followingNum: number;
  isFollowed: boolean;
}

export interface CommunityPostDetailServer {
  userInfoResDto: CommunityUserInfoDetail;
  id: number;
  title: string;
  introduction: string | null;
  likeCount: number;
  commentCount: number;
  liked?: boolean | null;
  completedAt: string;
  errorTag: string;
  postTags: string[];
  contents: TroubleContentBlock[];
  thumbnailUrl?: string | null;
  starRating?: number | null;
}

// 댓글
export interface CommunityCommentServerItem {
  commentId: number;
  postId: number;
  userId: number;
  name: string | null;
  profileImg: string | null;
  content: string;
  createdAt: string;
  parentCommentId: number | null;
}

// 댓글 목록 페이징 응답
export type GetCommunityCommentsResponse =
  PaginatedResponse<CommunityCommentServerItem>;

// 포스트 좋아요 응답 데이터
export interface CommunityLikeResult {
  postId: number;
  userId: number;
  likeCount: number;
}

// 댓글 생성 request body
export interface CreateCommentBody {
  contents: string;
}

// 좋아요한 포스트(커뮤니티) 서버 아이템
export interface LikedPostServerItem {
  postId: number;
  title: string;
  errorTags: string | null;
  techTags: string[];
  contents: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  images: string[] | null;
}

// 좋아요한 포스트 페이징 응답
export type GetLikedPostsResponse = PaginatedResponse<LikedPostServerItem>;
