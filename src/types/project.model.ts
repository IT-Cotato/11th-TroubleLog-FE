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

export interface CreateProjectResponse {
  status: number;
  message: string;
  data: ProjectData;
}

/// 전체 프로젝트 목록 조회

export interface ProjectListItem extends ProjectData {
  tags: string[];
}

export interface GetProjectListResponse {
  status: number;
  message: string;
  data: ProjectListItem[];
}

/// 프로젝트 상세 조회

export interface GetProjectDetailResponse {
  status: number;
  message: string;
  data: ProjectListItem;
}
