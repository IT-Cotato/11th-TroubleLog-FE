import type { CSSProperties } from "react";

interface DropdownOption {
  label: string;
  onClick: () => void;
}

interface KebabDropdownProps {
  options: DropdownOption[];
  position?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  } | null;
}

export default function KebabDropdown({
  options,
  position,
}: KebabDropdownProps) {
  const isSingleOption = options.length === 1;
  const dropdownStyle = {
    top: position?.top || "1.5rem",
    right: position?.right || "0",
    bottom: position?.bottom,
    left: position?.left,
  } as CSSProperties;

  return (
    <div
      className="absolute z-10 inline-block w-[min(180px,80vw)] sm:w-fit bg-white rounded-[8px] shadow-[0_0_10px_rgba(0,0,0,0.15)] overflow-hidden max-w-[calc(100vw-2rem)]"
      style={dropdownStyle}
    >
      {options.map((option, index) => (
        <button
          key={index}
          onClick={option.onClick}
          className={`text-body-14-regular sm:text-body-16-regular text-black text-center px-4 py-2.5 hover:bg-gray-100 w-full whitespace-nowrap ${
            !isSingleOption && index !== 0 ? "border-t border-gray-200" : ""
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
