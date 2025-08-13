// 서버 공통 응답 래퍼
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

// 페이징 구조
export interface PageMeta {
  hasNext: boolean;
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
  isFirst: boolean;
  isLast: boolean;
}

// 페이징 + ApiResponse 혼합형
export type ApiPageResponse<T> = ApiResponse<PageMeta & { content: T[] }>;

// 순수 페이징 응답 (ApiResponse 감싸지 않음)
export interface PaginatedResponse<T> extends PageMeta {
  content: T[];
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}
export interface ApiError {
  status: string;
  message: string;
  method: string;
  requestURI: string;
  errors: ApiErrorDetail[];
}
export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
}
