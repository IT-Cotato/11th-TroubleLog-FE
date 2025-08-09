import { http, HttpResponse } from "msw";
import type {
  GetProjectDetailResponse,
  CreateProjectResponse,
  GetProjectListResponse,
  CreateProjectRequest,
  ProjectListItem,
  ProjectData,
  DeleteProjectResponse,
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

  // PUT /project/:projectId - 프로젝트 수정
  http.put("/project/:projectId", async ({ params, request }) => {
    const id = Number(params.projectId);
    const body = (await request.json()) as CreateProjectRequest;

    const index = mockProjectList.findIndex((p) => p.id === id);
    if (index === -1) {
      return HttpResponse.json(
        { status: 404, message: "프로젝트를 찾을 수 없습니다.", data: null },
        { status: 404 }
      );
    }

    const updated: ProjectListItem = {
      ...mockProjectList[index],
      name: body.name,
      description: body.description,
      thumbnailImageUrl: body.thumbnailImageUrl,
    };
    mockProjectList[index] = updated;

    const data: ProjectData = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      thumbnailImageUrl: updated.thumbnailImageUrl,
    };

    return HttpResponse.json<CreateProjectResponse>(
      {
        status: 200,
        message: "프로젝트가 수정되었습니다.",
        data,
      },
      {
        status: 200,
      }
    );
  }),

  // DELETE /project/:projectId - 프로젝트 삭제
  http.delete("/project/:projectId", ({ params }) => {
    const id = Number(params.projectId);
    const index = mockProjectList.findIndex((p) => p.id === id);

    if (index === -1) {
      return HttpResponse.json<DeleteProjectResponse>(
        { status: 404, message: "프로젝트를 찾을 수 없습니다.", data: null },
        { status: 404 }
      );
    }

    mockProjectList.splice(index, 1);

    return HttpResponse.json<DeleteProjectResponse>(
      {
        status: 200,
        message: "프로젝트가 삭제되었습니다.",
        data: null,
      },
      { status: 200 }
    );
  }),
];
