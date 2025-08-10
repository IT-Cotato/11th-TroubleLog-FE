import type { TroubleListItem } from "@/types/trouble.model";
import getAPIResponseData from "@/utils/getAPIResponseData";

/// 전체 트러블슈팅 목록 조회

export const getTroubleList = () =>
  getAPIResponseData<TroubleListItem[]>({
    url: "/troubles/list",
    method: "GET",
  });

/// 프로젝트 내 트러블슈팅 목록 조회

export const getProjectTroubleList = (projectId: number) =>
  getAPIResponseData<TroubleListItem[]>({
    url: `/project/${projectId}/troubles`,
    method: "GET",
  });
