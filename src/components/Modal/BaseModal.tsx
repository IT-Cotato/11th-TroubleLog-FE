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
  width = "w-full max-w-[580px] sm:max-w-[700px] md:max-w-[900px]",
  className = "",
}: BaseModalProps) {
  const modalRef = useClickOutside(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 블러 */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/30" />
      {/* 모달 본문 */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`relative z-10 rounded-[20px] bg-white shadow-card flex flex-col items-center overflow-y-auto max-h-[90vh] ${width} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
