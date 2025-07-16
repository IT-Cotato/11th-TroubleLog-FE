import React, { useState } from "react";
import exitIcon from "../../assets/images/exiticon.svg";
export type TagCategory =
  | "프론트엔드"
  | "백엔드"
  | "모바일"
  | "데브옵스/인프라"
  | "데이터베이스"
  | "기타";

export interface Tag {
  label: string;
  category: TagCategory;
}

interface CategoryTagModalProps {
  allTags: Tag[];
  onSelect: (selected: string[]) => void;
  onClose: () => void;
  isOpen: boolean;
}

const CategoryTagModal: React.FC<CategoryTagModalProps> = ({
  allTags,
  onSelect,
  onClose,
  isOpen,
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<TagCategory>("프론트엔드");
  if (!isOpen) return null;
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredTags = allTags.filter(
    (tag) =>
      tag.category === activeCategory &&
      tag.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[694px] h-[564px] bg-white rounded-[20px] p-6 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">기술 태그 검색</h2>
          <button onClick={onClose} className="w-6 h-6">
            <img src={exitIcon} alt="닫기" className="w-full h-full" />
          </button>
        </div>

        {/* 검색창 */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your tag"
          className="w-full border rounded-md px-3 py-2 mb-3"
        />
        {/* 선택된 태그 */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
          {selectedTags.length === 0 ? (
            <span className="text-gray-400 text-sm">
              카테고리를 검색하세요.
            </span>
          ) : (
            selectedTags.map((tag) => (
              <span
                key={tag}
                className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm flex items-center gap-1"
              >
                #{tag}
                <button onClick={() => toggleTag(tag)}>✕</button>
              </span>
            ))
          )}
        </div>

        {/* 카테고리 필터 탭 */}
        <div className="flex gap-4 mb-4 text-sm">
          {[
            "프론트엔드",
            "백엔드",
            "모바일",
            "데브옵스/인프라",
            "데이터베이스",
            "기타",
          ].map((cat) => (
            <button
              key={cat}
              className={`pb-1 border-b-2 ${
                activeCategory === cat
                  ? "border-purple-500 font-semibold"
                  : "border-transparent text-gray-400"
              }`}
              onClick={() => setActiveCategory(cat as TagCategory)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 태그 리스트 */}
        <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[200px] mb-4">
          {filteredTags.map((tag) => (
            <button
              key={tag.label}
              onClick={() => toggleTag(tag.label)}
              className={`px-3 py-1 rounded-full text-sm border ${
                selectedTags.includes(tag.label)
                  ? "bg-purple-100 text-purple-600 border-purple-400"
                  : "bg-gray-100 text-gray-600 border-gray-300"
              }`}
            >
              #{tag.label}
            </button>
          ))}
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-[24px]">
          <button
            onClick={() => setSelectedTags([])}
            className="flex w-[299px] px-[57px] py-4 justify-center items-center gap-[10px] rounded-[12px] border border-[#E0E0E0] bg-white"
          >
            초기화
          </button>
          <button
            onClick={() => {
              onSelect(selectedTags);
              onClose();
            }}
            className="flex w-[299px] px-[57px] py-4 justify-center items-center gap-[10px] rounded-[12px] border border-[#E0E0E0] bg-purple-500"
          >
            <h1 className="text-white">확인</h1>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryTagModal;
