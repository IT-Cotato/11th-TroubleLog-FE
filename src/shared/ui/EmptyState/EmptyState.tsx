import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** 제목 또는 메인 문구 */
  title?: ReactNode;
  /** 부가 설명 */
  description?: ReactNode;
  /** 액션 버튼 등 (선택) */
  action?: ReactNode;
  className?: string;
}

/**
 * 목록/검색 결과가 없을 때 등 빈 상태를 표시하는 공통 컴포넌트
 */
export function EmptyState({
  title = "내용이 없어요",
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-12 px-4 text-center ${className}`}
    >
      {title != null && (
        <p className="text-body-16-regular text-gray-600">{title}</p>
      )}
      {description != null && (
        <p className="text-body-14-regular text-gray-500">{description}</p>
      )}
      {action != null && <div className="mt-2">{action}</div>}
    </div>
  );
}
