import { http, HttpResponse } from "msw";
import type {
  CreateProjectResponse,
  GetProjectListResponse,
} from "@/types/project.model";
import { mockProject, mockProjectList } from "./mockProject";

export const handlers = [
  // POST /project - 프로젝트 생성
  http.post("/project", async () => {
    return HttpResponse.json<CreateProjectResponse>(
      {
        status: 200,
        message: "OK",
        data: mockProject,
      },
      { status: 200 }
    );
  }),

  // GET /project/list - 전체 프로젝트 목록 조회
  http.get("/project/list", () => {
    return HttpResponse.json<GetProjectListResponse>(
      {
        status: 200,
        message: "OK",
        data: mockProjectList,
      },
      { status: 200 }
    );
  }),
];
