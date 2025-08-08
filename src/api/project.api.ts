import type { ProjectData, CreateProjectRequest } from "@/types/project.model";
import getAPIResponseData from "@/utils/getAPIResponseData";

export const postCreateProject = (payload: CreateProjectRequest) =>
  getAPIResponseData<ProjectData, CreateProjectRequest>({
    url: "/project",
    method: "POST",
    data: payload,
  });
