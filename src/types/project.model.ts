import type { ApiResponse, PaginatedResponse } from "./common.model";

export interface CreateProjectRequest {
  name: string;
  description: string;
  thumbnailImageUrl?: string;
}

export interface ProjectData {
  id: number;
  name: string;
  description: string;
  thumbnailImageUrl: string | null;
}

export interface ProjectListItem extends ProjectData {
  tags: string[];
}

// 프로젝트 생성
export type CreateProjectResponse = ApiResponse<ProjectData>;

// 전체 프로젝트 목록 조회
// 서버가 ApiResponse 감싸면
// export type GetProjectListResponse = ApiPageResponse<ProjectListItem>;

// 서버가 ApiResponse 없이 바로 페이징이면
export type GetProjectListResponse = PaginatedResponse<ProjectListItem>;

export type GetProjectDetailResponse = ApiResponse<ProjectListItem>;

export type DeleteProjectResponse = ApiResponse<null>;
