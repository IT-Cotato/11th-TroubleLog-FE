import type { PaginatedResponse } from "./common.model";

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

export type MyTroublesServerPage = PaginatedResponse<MyTroubleServerItem>;
