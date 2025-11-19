import type { TroublogCardProps } from "@/entities/trouble/ui/TroublogCard";

// 상태: 한글/영문 모두 허용
export const mapStatus = (raw?: string): TroublogCardProps["status"] => {
  const v = (raw ?? "").trim();
  const upper = v.toUpperCase();

  // 영문 enum 우선
  if (upper === "COMPLETED") return "complete";
  if (upper === "SUMMARIZED") return "created";
  if (upper === "IN_PROGRESS" || upper === "DRAFT") return "inProgress";
  if (upper === "WRITING") return "inProgress";

  // 레거시 한글도 지원
  if (v === "원본") return "complete";
  if (v === "요약본") return "created";
  if (v === "임시 저장" || v === "작성 중") return "inProgress";

  // 안전한 기본값
  return "complete";
};

// 공개 여부: boolean(true/false) + 영문 enum("PUBLIC"/"PRIVATE") 모두 허용
export const mapVisibility = (
  raw?: boolean | string | null
): TroublogCardProps["visibility"] => {
  if (typeof raw === "boolean") return raw ? "public" : "private";
  const v = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (v === "PUBLIC") return "public";
  if (v === "PRIVATE") return "private";
  // 모호하면 공개로
  return "public";
};

// 요약 유형: 영문 enum + 레거시 한글 라벨 모두 허용
export const mapSummaryType = (
  raw?: string
): TroublogCardProps["summaryType"] | undefined => {
  const v = (raw ?? "").trim();
  const upper = v.toUpperCase();

  // 서버 enum 우선
  if (upper === "RESUME") return "자기소개서";
  if (upper === "INTERVIEW") return "면접대비";
  if (upper === "BLOG") return "회고록";
  if (upper === "ISSUE_MANAGEMENT") return "이슈관리";
  if (upper === "NONE" || upper === "") return undefined;

  // 레거시 한글 라벨 지원
  if (v === "자기소개서 요약") return "자기소개서";
  if (v === "면접 요약") return "면접대비";
  if (v === "회고록용 요약") return "회고록";
  if (v === "이슈 템플릿") return "이슈관리";

  // 알 수 없는 값이면 표시 생략
  return undefined;
};
