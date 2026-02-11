/**
 * 카드 관련 확장 타입 정의
 */

import type { TroublogCardVM } from "@/entities/trouble/card.mapper";

/**
 * Summary 타입 정의
 */
export interface CardSummary {
  summaryId?: number;
  summaryType?: string;
  summaryCreatedAt?: string;
}

/**
 * HomePage에서 사용하는 확장된 카드 타입
 * summaries와 _kind 필드를 추가로 포함
 */
export interface ExpandedTroublogCard
  extends Omit<TroublogCardVM, "summaryType" | "status"> {
  summaries?: CardSummary[];
  _kind?: "draft" | "original" | "combined";
  summaryId?: number;
  summaryType?: string | TroublogCardVM["summaryType"];
  status?: TroublogCardVM["status"] | string;
  projectId?: number;
}
