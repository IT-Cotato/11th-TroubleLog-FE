import type {
  DailyStat,
  ErrorTagStat,
  SummaryTypeStat,
  TechTagStat,
} from "@/types/statistics.model";
import getAPIResponseData from "@/utils/getAPIResponseData";

// 동일 시점 다중 호출을 하나로 묶기 위한 in-flight Promise
let inflightDaily: Promise<DailyStat[] | null> | null = null;
let inflightErrorTags: Promise<ErrorTagStat[] | null> | null = null;
let inflightSummaryTypes: Promise<SummaryTypeStat[] | null> | null = null;
let inflightTechTags: Promise<TechTagStat[] | null> | null = null;

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

// 에러 태그별 통계
export async function getErrorTagTop3(): Promise<ErrorTagStat[] | null> {
  if (!inflightErrorTags) {
    inflightErrorTags = getAPIResponseData<ErrorTagStat[] | null>({
      url: "/statistics/errors",
      method: "GET",
    }).finally(() => {
      // 요청 종료 후 해제
      setTimeout(() => (inflightErrorTags = null), 0);
    });
  }
  return inflightErrorTags;
}

// 요약본 종류 통계
export async function getSummaryTypes(): Promise<SummaryTypeStat[] | null> {
  if (!inflightSummaryTypes) {
    inflightSummaryTypes = getAPIResponseData<SummaryTypeStat[] | null>({
      url: "/statistics/summary",
      method: "GET",
    }).finally(() => {
      setTimeout(() => (inflightSummaryTypes = null), 0);
    });
  }
  return inflightSummaryTypes;
}

// 기술 태그별 통계
export async function getTechTagsTop5(): Promise<TechTagStat[] | null> {
  if (!inflightTechTags) {
    inflightTechTags = getAPIResponseData<TechTagStat[] | null>({
      url: "/statistics/tags",
      method: "GET",
    }).finally(() => {
      setTimeout(() => (inflightTechTags = null), 0);
    });
  }
  return inflightTechTags;
}
