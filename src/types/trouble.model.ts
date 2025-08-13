import type { PaginatedResponse } from "@/types/common.model";

export type TroubleStatus = "작성 완료" | "임시 저장" | "요약 완료";
export type TroubleSummaryType = "에러 중심 요약" | "전체 흐름 요약" | string;

// 서버 아이템 스키마에 맞춰 유지
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

// 정렬 옵션 (서버 확장 가능성 고려해서 유니온 타입)
export type TroubleSort = "latest" | "oldest" | "popular";

// 페이징 응답(서버가 ApiResponse로 감싸지 않는 케이스)
export type GetTroubleListResponse = PaginatedResponse<TroubleListItem>;
export type GetProjectTroubleListResponse = PaginatedResponse<TroubleListItem>;
