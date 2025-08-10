import type { ApiResponse } from "./project.model";

export type TroubleStatus = "작성 완료" | "임시 저장" | "요약 완료";
export type TroubleSummaryType = "에러 중심 요약" | "전체 흐름 요약" | string;

export interface TroubleListItem {
  id: number;
  title: string;
  imageUrl: string;
  isVisible: boolean;
  date: string;
  starRating: number;
  error: string;
  techs: string[];
  status: TroubleStatus;
  summaryType: TroubleSummaryType;
}

/// 전체 트러블슈팅 목록 조회

export type GetTroubleListResponse = ApiResponse<TroubleListItem[]>;
