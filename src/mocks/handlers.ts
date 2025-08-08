import { http, HttpResponse } from "msw";
import type {
  GetProjectDetailResponse,
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

  // GET /project/:projectId - 프로젝트 상세 조회
  http.get("/project/:projectId", ({ params }) => {
    const id = Number(params.projectId);
    const found = mockProjectList.find((p) => p.id === id);

    if (!found) {
      return HttpResponse.json(
        { status: 404, message: "프로젝트를 찾을 수 없습니다.", data: null },
        { status: 404 }
      );
    }

    return HttpResponse.json<GetProjectDetailResponse>(
      {
        status: 200,
        message: "프로젝트 상세 조회 성공",
        data: found,
      },
      { status: 200 }
    );
  }),
];
