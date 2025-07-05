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
    <div className="flex flex-col justify-center items-start gap-2 min-h-[84px] w-full">
      <label className="text-black font-pretendard text-[18px] font-normal leading-normal">
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-[560px] h-12 px-4 py-3 rounded-lg border text-black font-pretendard placeholder:text-gray-500 placeholder:text-sm placeholder:font-normal placeholder:leading-normal
        ${error ? "border-red-500" : "border-gray-300 bg-white"}`}
      />
      {error && <p className="text-red-500 text-[13px] mt-1">{error}</p>}
    </div>
  );
};

export default Input;
