import type { PaginatedResponse } from "@/types/common.model";

export type TroubleStatus = "작성 완료" | "임시 저장" | "요약 완료";
export type TroubleSummaryType = "에러 중심 요약" | "전체 흐름 요약" | string;
export type TroubleSort = "latest" | "oldest" | "popular";

// 서버 아이템 스키마에 맞춰 유지
export interface TroubleListItem {
  id: number;
  projectId: number;
  title: string;
  imageUrl: string;
  isVisible: boolean;
  date: string;
  starRating: number;
  error: string;
  techs: string[];
  status: string;
  summaryType: string;
}

// 페이징 응답(서버가 ApiResponse로 감싸지 않는 케이스)
export type GetTroubleListResponse = PaginatedResponse<TroubleListItem>;

// 프로젝트 전용 쿼리 타입
export type ProjectTroubleStatus = "COMPLETED" | "SUMMARIZED";
export type ProjectTroubleSort = "LATEST" | "IMPORTANT" | "LIKES";
export type ProjectTroubleVisibility = "ALL" | "PUBLIC" | "PRIVATE";
export type ProjectTroubleSummaryType =
  | "NONE"
  | "RESUME"
  | "INTERVIEW"
  | "BLOG"
  | "ISSUE_MANAGEMENT";

// 프로젝트 전용 쿼리 파라미터
export interface ProjectTroubleQuery {
  status: ProjectTroubleStatus; // required
  sort?: ProjectTroubleSort;
  visibility?: ProjectTroubleVisibility;
  summaryType?: ProjectTroubleSummaryType;
}

// 프로젝트 전용 응답: getAPIResponseData가 .data 언래핑
export type GetProjectTroubleListResponse = TroubleListItem[];
