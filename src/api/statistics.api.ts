import type { DailyStat } from "@/types/statistics.model";
import getAPIResponseData from "@/utils/getAPIResponseData";

// 동일 시점 다중 호출을 하나로 묶기 위한 in-flight Promise
let inflightDaily: Promise<DailyStat[] | null> | null = null;

// 일일 트러블로그 활동 통계
export async function getDailyActivity(): Promise<DailyStat[] | null> {
  if (!inflightDaily) {
    inflightDaily = getAPIResponseData<DailyStat[] | null>({
      url: "/statistics/daily",
      method: "GET",
    }).finally(() => {
      // 요청 종료 후 해제(연속 클릭 등 대비)
      setTimeout(() => (inflightDaily = null), 0);
    });
  }
  return inflightDaily;
}
