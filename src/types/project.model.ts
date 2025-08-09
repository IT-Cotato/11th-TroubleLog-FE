export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

/// 프로젝트 생성

export interface CreateProjectRequest {
  name: string;
  description: string;
  thumbnailImageUrl: string;
}

export interface ProjectData {
  id: number;
  name: string;
  description: string;
  thumbnailImageUrl: string;
}

export type CreateProjectResponse = ApiResponse<ProjectData>;

/// 전체 프로젝트 목록 조회

export interface ProjectListItem extends ProjectData {
  tags: string[];
}

export type GetProjectListResponse = ApiResponse<ProjectListItem[]>;

/// 프로젝트 상세 조회

export type GetProjectDetailResponse = ApiResponse<ProjectListItem>;

/// 프로젝트 삭제

export type DeleteProjectResponse = ApiResponse<null>;
