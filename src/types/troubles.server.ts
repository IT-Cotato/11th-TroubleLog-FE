import type { PaginatedResponse } from "@/types/common.model";

// 공통 사용자 요약 (서버 키 이름은 parent마다 다르지만 구조는 동일)
export interface UserBrief {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
}

// /my/search의 경우
export interface TroubleSearchCard {
  postCardUserInfoResDto: UserBrief;
  id: number;
  title: string;
  thumbnailUrl: string | null;
  completedAt: string | null;
  errorTag: string | null;
  postTags: string[];
  likeCount: number;
  commentCount: number;
}

export type MyTroubleSearchPage = PaginatedResponse<TroubleSearchCard>;
export type UserTroubleSearchPage = PaginatedResponse<TroubleSearchCard>;

// community/search의 경우
export type StarRatingLabel =
  | "NONE"
  | "ONE_STAR"
  | "TWO_STARS"
  | "THREE_STARS"
  | "FOUR_STARS"
  | "FIVE_STARS";

export interface CommunitySearchContentBlock {
  id: number;
  subTitle: string | null;
  body: string | null;
  sequence: number;
}

export interface CommunityTroubleSearchItem {
  id: number;
  title: string;
  introduction: string | null;
  likeCount: number;
  commentCount: number;
  isVisible: boolean;
  isSummaryCreated: boolean;
  isDeleted: boolean;
  postStatus: string;
  starRating: StarRatingLabel;
  templateType: string | null;
  checklistError: number[];
  checklistReason: number[];
  createdAt: string;
  updatedAt: string;
  userInfo: UserBrief;
  projectId: number;
  errorTag: string | null;
  postTags: string[];
  contents: CommunitySearchContentBlock[];
  thumbnailUrl: string | null;
}

export type CommunityTroubleSearchPage =
  PaginatedResponse<CommunityTroubleSearchItem>;

// 상세/기존 API 호환용 (authorType/summaryType)
export interface TroubleContentBlock {
  id: number;
  subTitle: string | null;
  body: string | null;
  sequence: number;
  authorType?: string; // 상세 응답에서만 존재
  summaryType?: string; // 상세 응답에서만 존재
}

// 예전의 MyTroubleDetailItem은 상세 전용으로 이름을 바꿔두는 걸 추천
export interface MyTroubleDetailItem {
  id: number;
  title: string;
  introduction: string | null;
  likeCount: number;
  commentCount: number;
  isVisible: boolean;
  isSummaryCreated: boolean;
  isDeleted: boolean;
  postStatus: string;
  starRating: number | null;
  checklistError: number[];
  checklistReason: number[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userId: number;
  projectId: number | null;
  errorTag: string | null;
  postTags: string[];
  contents: TroubleContentBlock[];
  thumbnailUrl: string | null;
}

export type MyTroubleDetailPage = PaginatedResponse<MyTroubleDetailItem>;
