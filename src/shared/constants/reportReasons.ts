import type { ReportType } from "@/api/report.api";

/** 신고 사유 옵션 (API reportType + 표시 라벨) */
export const REPORT_OPTIONS: { reportType: ReportType; label: string }[] = [
  { reportType: "SPAM", label: "스팸 및 홍보성 게시글" },
  { reportType: "INFO", label: "기술적 오류 및 잘못된 정보" },
  { reportType: "BLAME", label: "비방, 욕설 및 혐오 표현" },
  { reportType: "PRIVACY", label: "개인정보노출" },
  { reportType: "SUBJECT", label: "주제와 맞지 않는 게시글" },
  { reportType: "COPYRIGHT", label: "저작권 침해 및 무단 전재" },
];

/** 하위 호환: 라벨만의 배열 */
export const REPORT_REASONS = REPORT_OPTIONS.map(
  (o) => o.label,
) as unknown as readonly [string, string, string, string, string, string];
export type ReportReason = (typeof REPORT_REASONS)[number];
