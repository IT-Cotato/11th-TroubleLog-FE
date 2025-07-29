// components/DropDownButton.tsx
import { useState } from "react";
import dropdownicon from "/icons/dropdowndown_icon.svg";

interface DropDownButtonProps {
  options: string[];
  placeholder?: string;
  onSelect?: (value: string) => void;
  width?: string;
}

const DropDownButton = ({
  options,
  placeholder = "선택하세요",
  onSelect,
  width = "w-[300px]",
}: DropDownButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelected(option);
    setIsOpen(false);
    onSelect?.(option);
  };

  return (
    <div className={`relative ${width}`}>
      <button
        className={`flex justify-between items-center h-[36px] px-[15px] py-[7px] border border-gray-300 rounded-[5px] bg-white text-sm text-gray-400 w-full`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selected || placeholder}</span>
        <img src={dropdownicon} alt="dropdown icon" className="w-6 h-6" />
      </button>

      {isOpen && (
        <ul className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto">
          {options.map((option) => (
            <li
              key={option}
              onClick={() => handleSelect(option)}
              className="px-4 py-2 hover:bg-purple-100 cursor-pointer text-sm whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DropDownButton;
