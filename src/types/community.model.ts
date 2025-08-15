import type { PaginatedResponse } from "@/types/common.model";
import type { TroubleContentBlock } from "./troubles.server";

export type CommunitySort = "latest" | "likes";

export interface CommunityServerCard {
  postCardUserInfoResDto: {
    userId: number;
    nickname: string;
    profileImageUrl: string | null;
  };
  id: number;
  title: string;
  thumbnailUrl: string | null;
  completedAt: string;
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
}

export interface CommunityPostDetailServer {
  userInfoResDto: CommunityUserInfoDetail;
  id: number;
  title: string;
  introduction: string | null;
  likeCount: number;
  commentCount: number;
  completedAt: string;
  errorTag: string;
  postTags: string[];
  contents: TroubleContentBlock[];
  thumbnailUrl?: string | null;
}
