import type { ApiEnvelope } from "./common.model";

export interface DailyStat {
  date: string;
  count: number;
}

export interface ErrorTagStat {
  name: string;
  count: number;
}

export interface SummaryTypeStat {
  name: string;
  count: number;
}

export type GetDailyStatsResponse = ApiEnvelope<DailyStat[]>;
