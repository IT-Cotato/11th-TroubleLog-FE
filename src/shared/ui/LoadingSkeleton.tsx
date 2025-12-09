import type { ReactNode } from "react";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  children?: ReactNode;
}

/**
 * 범용 로딩 스켈레톤 컴포넌트
 */
export function LoadingSkeleton({
  className = "",
  count = 1,
  children,
}: LoadingSkeletonProps) {
  if (children) {
    return <div className={`animate-pulse ${className}`}>{children}</div>;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 rounded ${className}`}
        />
      ))}
    </>
  );
}

/**
 * 카드 리스트용 스켈레톤
 */
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-gray-200 rounded-lg h-24 sm:h-32"
        />
      ))}
    </div>
  );
}

/**
 * 프로필 이미지 스켈레톤
 */
export function ProfileImageSkeleton({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-full ${sizeClasses[size]}`}
    />
  );
}

/**
 * 텍스트 라인 스켈레톤
 */
export function TextLineSkeleton({
  width = "full",
  height = "h-4",
}: {
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${height} ${
        width === "full" ? "w-full" : width
      }`}
    />
  );
}
