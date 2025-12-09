import type { ReactNode } from "react";

interface BaseModalProps {
  onClose: () => void;
  children: ReactNode;
  width?: string;
  className?: string;
}

export default function BaseModal({
  onClose,
  children,
  width = "w-[min(580px,92vw)]",
  className = "",
}: BaseModalProps) {
  // onClose는 외부 클릭 시 닫기 기능 제거로 인해 사용하지 않지만,
  // 다른 모달 컴포넌트와의 호환성을 위해 props로 유지합니다.
  void onClose;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 배경 블러 */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/10" />
      {/* 모달 본문 */}
      <div
        className={`relative z-10 rounded-[20px] bg-white shadow-card flex max-h-[90vh] overflow-auto flex-col items-center ${width} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
