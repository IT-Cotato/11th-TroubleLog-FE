import type {
  ProjectData,
  CreateProjectRequest,
  ProjectListItem,
  DeleteProjectResponse,
  GetProjectListResponse,
} from "@/types/project.model";
import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "@/api/axios";

/// 프로젝트 생성

export const postCreateProject = (payload: CreateProjectRequest) =>
  getAPIResponseData<ProjectData, CreateProjectRequest>({
    url: "/project",
    method: "POST",
    data: payload,
  });

/// 전체 프로젝트 목록 조회

export const getProjectList = (page = 1, size = 10) =>
  getAPIResponseData<GetProjectListResponse>(
    api.get("/projects", {
      params: { page, size },
    })
  );

/// 프로젝트 상세 조회

export const getProjectDetail = (projectId: number) =>
  getAPIResponseData<ProjectListItem>({
    url: `/project/${projectId}`,
    method: "GET",
  });

/// 프로젝트 수정

export const putUpdateProject = (
  projectId: number,
  payload: CreateProjectRequest
) =>
  getAPIResponseData<ProjectData, CreateProjectRequest>({
    url: `/project/${projectId}`,
    method: "PUT",
    data: payload,
  });

/// 프로젝트 삭제
export const deleteProject = (projectId: number) =>
  getAPIResponseData<DeleteProjectResponse>({
    url: `/project/${projectId}`,
    method: "DELETE",
  });
