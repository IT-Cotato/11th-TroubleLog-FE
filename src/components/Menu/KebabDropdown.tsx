interface DropdownOption {
  label: string;
  onClick: () => void;
}

interface KebabDropdownProps {
  options: DropdownOption[];
}

export default function KebabDropdown({ options }: KebabDropdownProps) {
  const isSingleOption = options.length === 1;

  return (
    <div className="absolute right-0 top-6 z-10 bg-white rounded-[8px] shadow-[0px_0px_10px_rgba(0,0,0,0.15)] min-w-[96px] overflow-hidden">
      {options.map((option, index) => {
        return (
          <button
            key={index}
            onClick={option.onClick}
            className={`w-full text-center text-body-16-regular text-black px-[12px] py-[10px] hover:bg-gray-100 ${
              !isSingleOption && index !== 0 ? "border-t border-gray-200" : ""
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
