import type {
  ProjectData,
  CreateProjectRequest,
  DeleteProjectResponse,
  GetProjectListResponse,
  UpdateProjectRequest,
  ProjectDetail,
} from "@/types/project.model";
import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "@/api/axios";
import type {
  GetProjectTroubleListResponse,
  ProjectTroubleSort,
  ProjectTroubleSummaryType,
} from "@/entities/trouble";

/// 프로젝트 생성
export const postCreateProject = (payload: CreateProjectRequest) => {
  // 빈 값이면 제거
  const body: CreateProjectRequest = { ...payload };
  if (!body.thumbnailImageUrl || body.thumbnailImageUrl.trim() === "") {
    delete body.thumbnailImageUrl;
  }

  return getAPIResponseData<ProjectData, CreateProjectRequest>({
    url: "/projects",
    method: "POST",
    data: body,
  });
};

/// 전체 프로젝트 목록 조회
export const getProjectList = (page = 1, size = 10) =>
  getAPIResponseData<GetProjectListResponse>(
    api.get("/projects", {
      params: { page, size },
    })
  );

/// 프로젝트 상세 조회
export const getProjectDetail = (projectId: number) =>
  getAPIResponseData<ProjectDetail>({
    url: `/projects/${projectId}`,
    method: "GET",
  });

/// 프로젝트 요약본 목록 조회
export const getProjectSummaries = (
  projectId: number,
  params: {
    sort?: ProjectTroubleSort; // "LATEST" | "IMPORTANT" | "LIKES"
    summaryType?: ProjectTroubleSummaryType; // "NONE" | "RESUME" | ...
  }
) =>
  getAPIResponseData<GetProjectTroubleListResponse>({
    url: `/projects/${projectId}/summaries`,
    method: "GET",
    params: {
      sort: params.sort,
      summaryType: params.summaryType ?? "RESUME",
    },
  });

/// 프로젝트 수정
export const putUpdateProject = (
  projectId: number,
  payload: UpdateProjectRequest
) => {
  const body: UpdateProjectRequest = {
    name: payload.name,
    description: payload.description,
    ...(Object.prototype.hasOwnProperty.call(payload, "thumbnailImageUrl")
      ? {
          thumbnailImageUrl: (payload.thumbnailImageUrl ?? "").trim(), // undefined 방지 + 공백 제거
        }
      : {}),
  };

  return getAPIResponseData<ProjectData, UpdateProjectRequest>({
    url: `/projects/${projectId}`,
    method: "PUT",
    data: body,
  });
};

/// 프로젝트 삭제
export const deleteProject = (projectId: number) =>
  getAPIResponseData<DeleteProjectResponse>({
    url: `/projects/${projectId}`,
    method: "DELETE",
  });
