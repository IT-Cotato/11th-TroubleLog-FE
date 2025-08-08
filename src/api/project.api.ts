import type {
  ProjectData,
  CreateProjectRequest,
  ProjectListItem,
} from "@/types/project.model";
import getAPIResponseData from "@/utils/getAPIResponseData";

/// 프로젝트 생성

export const postCreateProject = (payload: CreateProjectRequest) =>
  getAPIResponseData<ProjectData, CreateProjectRequest>({
    url: "/project",
    method: "POST",
    data: payload,
  });

/// 전체 프로젝트 목록 조회

export const getProjectList = () =>
  getAPIResponseData<ProjectListItem[]>({
    url: "/project/list",
    method: "GET",
  });

/// 프로젝트 상세 조회

export const getProjectDetail = (projectId: number) =>
  getAPIResponseData<ProjectListItem>({
    url: `/project/${projectId}`,
    method: "GET",
  });
