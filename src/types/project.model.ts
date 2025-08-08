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
