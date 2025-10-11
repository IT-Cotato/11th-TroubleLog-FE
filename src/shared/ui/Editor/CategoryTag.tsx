import { useState } from "react";
import CategoryTagModal from "@/pages/TempWrite/CategoryTagModal";
import { allTags } from "@/features/template-write/lib/tagData";
import searchIcon2 from "@/assets/icons/searchicon2.svg";

interface CategoryTagProps {
  value: string[];
  onChange: (val: string[]) => void;
}

const CategoryTag = ({ value, onChange }: CategoryTagProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full flex flex-wrap items-center gap-2 sm:gap-[15px]">
      {/* 왼쪽: 검색창 (모바일 전체폭, 큰 화면 고정폭) */}
      <div
        className="flex px-[15px] py-[7px] border border-gray-300 rounded-2xl items-center gap-[35px] w-full sm:w-[200px] md:w-[220px] flex-shrink-0 cursor-pointer"
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

      {/* 오른쪽: 선택된 태그 (남은 공간 활용 + 줄바꿈) */}
      <div className="flex-1 min-w-0 flex gap-2 flex-wrap">
        {value.map((tag) => (
          <div
            key={tag}
            className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
          >
            #{tag}
            <button
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="text-gray-400 hover:text-gray-600"
              aria-label={`${tag} 태그 삭제`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

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
