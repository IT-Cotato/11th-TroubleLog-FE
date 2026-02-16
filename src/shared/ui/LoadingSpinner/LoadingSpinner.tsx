import type { ReactNode } from "react";

export interface LoadingSpinnerProps {
  /** 스피너 크기: sm | default | lg */
  size?: "sm" | "default" | "lg";
  /** 스피너 아래 텍스트 */
  message?: ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 border-2",
  default: "w-12 h-12 border-4",
  lg: "w-16 h-16 border-4",
};

/**
 * 공통 로딩 스피너
 */
export function LoadingSpinner({
  size = "default",
  message,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-label={message ? undefined : "로딩 중"}
    >
      <div
        className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`}
      />
      {message != null && (
        <p className="text-body-16-regular text-gray-600">{message}</p>
      )}
    </div>
  );
}
