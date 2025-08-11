import { useState } from "react";
import CategoryTagModal from "@/pages/TempWrite/CategoryTagModal";
import { allTags } from "@/pages/TempWrite/tagData";
import searchIcon2 from "@/assets/icons/searchicon2.svg";

interface CategoryTagProps {
  value: string[];
  onChange: (val: string[]) => void;
}

const CategoryTag = ({ value, onChange }: CategoryTagProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full flex items-center gap-[15px]">
      {/* 왼쪽: 검색창 */}
      <div
        className="flex px-[15px] py-[7px] border border-gray-300 rounded-2xl items-center gap-[20px] w-[208px] cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <span className="text-gray-400 font-normal text-sm whitespace-nowrap">
          카테고리를 검색해 주세요
        </span>
        <img
          src={searchIcon2}
          className="w-[18px] h-[18px] aspect-square object-contain"
          alt="검색 아이콘"
        />
      </div>

      {/* 오른쪽: 선택된 태그 */}
      <div className="flex gap-2 flex-wrap">
        {value.map((tag) => (
          <div
            key={tag}
            className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
          >
            #{tag}
            <button
              onClick={() => {
                onChange(value.filter((t) => t !== tag));
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 모달 */}
      <CategoryTagModal
        isOpen={isOpen}
        allTags={allTags}
        onClose={() => setIsOpen(false)}
        onSelect={(val) => {
          onChange(val);
          setIsOpen(false);
        }}
      />
    </div>
  );
};

export default CategoryTag;
