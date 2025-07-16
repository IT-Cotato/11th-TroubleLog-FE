import { useState } from "react";
import dropdownicon from "/src/assets/images/dropdown_icon.svg";

const errorOptions = [
  "Build / Compile Error",
  "Runtime Error",
  "Dependency / Version Error",
  "Network / API Error",
  "Authentication / Authorization Error",
  "Database Error",
  "UI / Rendering Error",
  "Configuration Error",
  "Timeout / Error Handling",
  "Third-Party Library Error",
  "Others",
];

const DropDownButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("에러 종류를 선택하세요");

  const handleSelect = (option: string) => {
    setSelected(option);
    setIsOpen(false);
  };

  return (
    <div className="relative w-[340px]">
      <button
        className="flex justify-between items-center w-[300px] h-[36px] px-[15px] py-[7px] border border-[#B8B8E2] rounded-[5px] bg-white text-sm text-black"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selected}</span>
        <img src={dropdownicon} alt="dropdown icon" className="w-6 h-6" />
      </button>

      {isOpen && (
        <ul className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto">
          {errorOptions.map((option) => (
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
