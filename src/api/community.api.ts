import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "./axios";
import type {
  CommunitySort,
  GetCommunityListResponse,
} from "@/types/community.model";

export const getCommunityList = (
  page0 = 0,
  size = 12,
  sortBy: CommunitySort = "latest"
) =>
  getAPIResponseData<GetCommunityListResponse>(
    api.get<GetCommunityListResponse>("/community/list", {
      params: {
        page: Math.max(1, page0 + 1),
        size,
        sortBy,
      },
    })
  );
