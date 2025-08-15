import type { PaginatedResponse } from "@/types/common.model";

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
