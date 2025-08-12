import type { TroublogCardProps } from "@/components/Card/TroublogCard";

export const mapStatus = (ko: string): TroublogCardProps["status"] =>
  ko === "작성 완료"
    ? "complete"
    : ko === "임시 저장"
    ? "inProgress"
    : "created";

export const mapVisibility = (v: boolean): TroublogCardProps["visibility"] =>
  v ? "public" : "private";

// 필요할 때만 사용 (API ↔ 카드 유니온 다르면 undefined 반환)
export const mapSummaryType = (
  apiSummary?: string
): TroublogCardProps["summaryType"] | undefined => {
  switch (apiSummary) {
    case "면접 요약":
      return "면접대비";
    case "블로그용 요약":
      return "블로그";
    case "이슈 템플릿":
      return "이슈관리";
    case "자기소개서 요약":
      return "자기소개서";
    default:
      return undefined;
  }
};
