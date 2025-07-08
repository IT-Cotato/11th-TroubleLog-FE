import { useState } from "react";

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
    <div className="relative w-full max-w-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left border border-gray-300 rounded-md px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        {selected}
      </button>

      {isOpen && (
        <ul className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto">
          {errorOptions.map((option) => (
            <li
              key={option}
              onClick={() => handleSelect(option)}
              className="px-4 py-2 hover:bg-purple-100 cursor-pointer"
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
