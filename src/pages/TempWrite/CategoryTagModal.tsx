import React, { useState } from "react";
import exitIcon from "../../assets/images/exiticon.svg";

export type TagCategory =
  | "프론트엔드"
  | "백엔드"
  | "데브옵스"
  | "인프라"
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
  const [activeCategory, setActiveCategory] = useState<TagCategory | null>(
    null
  );

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredTags = allTags.filter((tag) => {
    const matchesQuery = tag.label
      .toLocaleLowerCase("ko")
      .includes(query.toLocaleLowerCase("ko"));
    const matchesCategory = activeCategory
      ? tag.category === activeCategory
      : true;

    return matchesQuery && matchesCategory;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[694px] h-[564px] bg-white rounded-[20px] shadow-md flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 */}
        <div className="flex justify-between items-center p-5 pb-0">
          <h2 className="text-xl font-bold">기술 태그 검색</h2>
          <button onClick={onClose} className="w-6 h-6">
            <img src={exitIcon} alt="닫기" className="w-full h-full" />
          </button>
        </div>

        {/* 검색창 */}
        <div className="px-6 pt-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your tag"
            className="w-full border rounded-md px-3 py-2 mb-3"
          />
        </div>

        {/* 선택된 태그 */}
        <div className="px-6 mb-2 min-h-[40px]">
          <div className="flex flex-wrap gap-2">
            {selectedTags.length === 0 ? (
              query ? (
                <span className="text-gray-400 text-sm">
                  검색 결과를 선택하세요.
                </span>
              ) : (
                <span className="text-gray-400 text-sm">
                  카테고리를 선택하거나 태그를 검색하세요.
                </span>
              )
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
        </div>
        <div className=" flex px-[27px] py-[10px] flex-col justify-center items-start gap-[28px] self-stretch">
          {/* 카테고리 버튼 */}
          <div className="flex justify-center items-center self-stretch px-6 mb-2">
            <div className="flex  gap-[40px] text-sm">
              {["프론트엔드", "백엔드", "데브옵스", "데이터베이스", "기타"].map(
                (cat) => (
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
                )
              )}
            </div>
          </div>

          {/* 태그 리스트 */}
          <div className="px-6 overflow-y-auto max-h-[220px]">
            <div className="flex justify-center flex-wrap gap-[24px] pb-4">
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
                  # {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* 하단 고정 버튼 */}
        <div className="px-6 py-7 border-t flex justify-between gap-4 mt-auto">
          <button
            onClick={() => {
              setSelectedTags([]);
              setActiveCategory(null);
              setQuery("");
            }}
            className="w-1/2 py-3 border border-gray-300 rounded-[12px] bg-white"
          >
            <span className="text-gray3">초기화</span>
          </button>
          <button
            onClick={() => {
              onSelect(selectedTags);
              onClose();
            }}
            className="w-1/2 py-3 rounded-[12px] bg-purple-500 text-white"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryTagModal;
