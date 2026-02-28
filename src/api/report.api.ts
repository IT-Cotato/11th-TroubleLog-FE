import getAPIResponseData from "@/utils/getAPIResponseData";
import api from "./axios";

/** 신고 대상 타입 */
export type ReportTargetType = "POST" | "COMMENT";

/** 신고 사유 (API reportType) */
export type ReportType =
  | "SPAM"
  | "INFO"
  | "BLAME"
  | "PRIVACY"
  | "SUBJECT"
  | "COPYRIGHT";

export interface CreateReportBody {
  reportedUserId: number;
  targetType: ReportTargetType;
  targetId: number;
  reportType: ReportType;
  copyrightImgUrl?: string;
}

/**
 * 신고 생성 API
 * POST /reports
 */
export function createReport(body: CreateReportBody): Promise<void> {
  const payload: Record<string, unknown> = {
    reportedUserId: body.reportedUserId,
    targetType: body.targetType,
    targetId: body.targetId,
    reportType: body.reportType,
    copyrightImgUrl: body.copyrightImgUrl ?? "",
  };
  return getAPIResponseData<void>(
    api.post("/reports", payload)
  ).then(() => undefined);
}
