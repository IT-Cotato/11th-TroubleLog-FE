import React from "react";

interface InputProps {
  label: string;
  type: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  name?: string;
  errorActionLabel?: string;
  onErrorActionClick?: () => void;
}

const Input: React.FC<InputProps> = ({
  label,
  type,
  value,
  placeholder,
  onChange,
  onBlur,
  error,
  name,
  errorActionLabel,
  onErrorActionClick,
}) => {
  const showError = Boolean(error);

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <label className="text-black font-pretendard text-base sm:text-lg font-normal leading-normal">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full max-w-[560px] h-12 px-4 py-3 rounded-lg border text-black font-pretendard placeholder:text-gray-500 placeholder:text-sm placeholder:font-normal placeholder:leading-normal focus:outline-none focus:ring-2 focus:ring-purple-300
      ${
        error ? "border-red-500 focus:ring-red-200" : "border-gray-300 bg-white"
      }`}
        aria-invalid={!!error}
        aria-describedby={showError ? `${name ?? label}-error` : undefined}
      />

      {/* 에러 메시지 + 우측 액션 버튼 영역 */}
      <div
        id={`${name ?? label}-error`}
        className={`mt-1 min-h-[20px] w-full max-w-[560px] flex items-center transition-opacity duration-150 ${
          showError ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-live={showError ? "polite" : undefined}
        role={showError ? "alert" : undefined}
        aria-hidden={!showError}
      >
        <span className={`text-[13px] ${showError ? "text-red-500" : ""}`}>
          {error || "placeholder"}
        </span>

        {showError && errorActionLabel && onErrorActionClick && (
          <button
            type="button"
            onClick={onErrorActionClick}
            className="pl-5 text-[13px] font-pretendard underline hover:opacity-80"
          >
            {errorActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
