import { useState } from "react";
import plusIcon from "@/assets/icons/plus.svg";

interface CategoryTagProps {
  value: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
}

const CategoryTag = ({ value, onChange }: CategoryTagProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      const trimmed = inputValue.trim();

      onChange((prev) => {
        if (!prev.includes(trimmed)) return [...prev, trimmed];
        return prev;
      });

      setInputValue("");
    }
  };

  return (
    <div className="w-full flex flex-wrap items-center gap-2 sm:gap-[15px]">
      <div className="flex px-[15px] py-[7px] border border-gray-300 rounded-2xl items-center gap-2 w-full sm:w-[180px] md:w-[200px] flex-shrink-0">
        <input
          type="text"
          className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none"
          placeholder="태그를 입력 후 Enter"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <img
          src={plusIcon}
          className="w-[18px] h-[18px] aspect-square object-contain"
          alt="추가 아이콘"
        />
      </div>

      <div className="flex-1 min-w-0 flex gap-2 flex-wrap">
        {value.map((tag) => (
          <div
            key={tag}
            className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
          >
            #{tag}
            <button
              onClick={() => onChange((prev) => prev.filter((t) => t !== tag))}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryTag;
