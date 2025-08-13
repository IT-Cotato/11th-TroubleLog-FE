import type {
  GetProjectTroubleListResponse,
  GetTroubleListResponse,
  ProjectTroubleQuery,
  TroubleSort,
} from "@/types/trouble.model";
import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "./axios";

/// 전체 트러블슈팅 목록 조회
export const getTroubleList = (
  page = 1,
  size = 10,
  sortBy: TroubleSort = "latest"
) =>
  getAPIResponseData<GetTroubleListResponse>(
    api.get<GetTroubleListResponse>("/troubles/list", {
      params: { page, size, sortBy },
    })
  );

/// 프로젝트 내 트러블슈팅 목록 조회
export const getProjectTroubleList = (
  projectId: number,
  query: ProjectTroubleQuery
) =>
  getAPIResponseData<GetProjectTroubleListResponse>({
    url: `/projects/${projectId}/troubles`,
    method: "GET",
    params: query, // { status: 'COMPLETED'|'SUMMARIZED', ...선택 }
  });
