import useClickOutside from "@/hooks/useClickOutside";
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
  width = "w-[580px]",
  className = "",
}: BaseModalProps) {
  const modalRef = useClickOutside(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 블러 */}
      <div className="absolute inset-0 backdrop-blur-sm" />
      {/* 모달 본문 */}
      <div
        ref={modalRef}
        className={`relative z-10 rounded-[20px] bg-white shadow-card flex flex-col items-center ${width} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
