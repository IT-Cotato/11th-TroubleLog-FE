import type { TroubleListItem } from "@/types/trouble.model";
import getAPIResponseData from "@/utils/getAPIResponseData";

export const getTroubleList = () =>
  getAPIResponseData<TroubleListItem[]>({
    url: "/troubles/list",
    method: "GET",
  });
