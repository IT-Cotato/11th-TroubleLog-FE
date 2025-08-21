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
}) => {
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
      />

      <p
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

export default Input;
