import React from "react";
import { FiChevronRight } from "react-icons/fi";

interface TermsFieldProps {
  label: string;
  onOpen: () => void;
  text?: string;
  error?: string;
  describedBy?: string;
}

const TermsField: React.FC<TermsFieldProps> = ({
  label,
  onOpen,
  text = "이용약관 및 개인정보처리방침 확인하기",
  error,
  describedBy,
}) => {
  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <label className="text-black font-pretendard text-base sm:text-lg font-normal leading-normal">
        {label}
      </label>

      <button
        type="button"
        onClick={onOpen}
        className={`w-full max-w-[560px] h-12 px-4 py-3 rounded-lg border bg-white text-left
        flex items-center justify-between
        font-pretendard text-gray-600
        hover:bg-gray-50 transition
        focus:outline-none focus:ring-2 focus:ring-purple-300
        ${error ? "border-red-500 focus:ring-red-200" : "border-gray-300"}`}
        aria-describedby={describedBy}
      >
        <span className="truncate text-sm">{text}</span>
        <FiChevronRight className="shrink-0 text-primary" />
      </button>

      <p
        id={describedBy}
        className={`text-[13px] mt-1 min-h-[20px] transition-opacity duration-150
        ${error ? "text-red-500 opacity-100" : "opacity-0"}`}
        aria-live={error ? "polite" : undefined}
        role={error ? "alert" : undefined}
        aria-hidden={!error}
      >
        {error || "placeholder"}
      </p>
    </div>
  );
};

export default TermsField;
