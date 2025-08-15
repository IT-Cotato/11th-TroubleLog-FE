import type { PaginatedResponse } from "@/types/common.model";

export interface TroubleContentBlock {
  id: number;
  subTitle: string | null;
  body: string | null;
  sequence: number;
  authorType: string;
  summaryType: string;
}

export interface MyTroubleServerItem {
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

// 서버 페이징 응답 (ApiResponse로 감싸지지 않는 케이스)
export type MyTroublesServerPage = PaginatedResponse<MyTroubleServerItem>;
