import React, { useEffect, useMemo, useState } from "react";
import exitIcon from "@/assets/icons/exiticon.svg";
import { getTagsByKeyword, getTagsByCategory } from "@/api/post.api";

// ===== 타입 정리 =====
type UiTagCategory =
  | "프론트엔드"
  | "백엔드"
  | "데브옵스"
  | "인프라"
  | "데이터베이스"
  | "기타";

// 태그 타입 - UI용
export type TagCategory = UiTagCategory;

type ApiTagCategory =
  | "FRONTEND"
  | "BACKEND"
  | "DEVOPS"
  | "INFRA"
  | "DATABASE"
  | "TOOL";

// UI -> API 카테고리
const UI_TO_API: Record<UiTagCategory, ApiTagCategory> = {
  프론트엔드: "FRONTEND",
  백엔드: "BACKEND",
  데브옵스: "DEVOPS",
  인프라: "INFRA",
  데이터베이스: "DATABASE",
  기타: "TOOL",
};

// string[]
function normalizeTagList(data: any): string[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    if (typeof data[0] === "string") return data as string[];
    return data.map((t: any) => t?.label ?? t?.name ?? String(t));
  }
  if (Array.isArray((data as any).tags))
    return normalizeTagList((data as any).tags);
  if (Array.isArray((data as any).data))
    return normalizeTagList((data as any).data);
  return [];
}

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
  const [activeCategory, setActiveCategory] = useState<UiTagCategory | null>(
    null
  );

  const [remoteTags, setRemoteTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let stop = false;

    if (!debouncedQuery) {
      setRemoteTags([]);
      return;
    }

    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getTagsByKeyword({ tagName: debouncedQuery });
        if (!stop) setRemoteTags(Array.from(new Set(normalizeTagList(data))));
      } catch {
        if (!stop) setRemoteTags([]);
      } finally {
        if (!stop) setLoading(false);
      }
    }, 300);

    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [debouncedQuery]);

  useEffect(() => {
    let stop = false;

    if (!activeCategory || debouncedQuery) {
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const apiCategory: ApiTagCategory =
          UI_TO_API[activeCategory as UiTagCategory];
        const data = await getTagsByCategory({ tagCategory: apiCategory });
        if (!stop) setRemoteTags(Array.from(new Set(normalizeTagList(data))));
      } catch {
        if (!stop) setRemoteTags([]);
      } finally {
        if (!stop) setLoading(false);
      }
    })();

    return () => {
      stop = true;
    };
  }, [activeCategory, debouncedQuery]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      return Array.from(new Set(next));
    });
  };

  const localFiltered = useMemo(() => {
    const byCat = (t: Tag) =>
      activeCategory ? t.category === activeCategory : true;
    const byQuery = (t: Tag) =>
      debouncedQuery
        ? t.label
            .toLocaleLowerCase("ko")
            .includes(debouncedQuery.toLocaleLowerCase("ko"))
        : true;

    const labels = allTags
      .filter((t) => byCat(t) && byQuery(t))
      .map((t) => t.label);
    return Array.from(new Set(labels));
  }, [allTags, activeCategory, debouncedQuery]);

  const usingServer =
    debouncedQuery.length > 0 ||
    (!!activeCategory && debouncedQuery.length === 0);
  const displayList = usingServer ? remoteTags : localFiltered;

  return !isOpen ? null : (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[694px] h-[564px] bg-white rounded-[20px] shadow-md flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
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

        {/* 카테고리 */}
        <div className="flex px-[27px] pt-[10px] flex-col gap-[8px]">
          <div className="flex justify-center items-center self-stretch px-6 mb-2">
            <div className="flex gap-[40px] text-sm">
              {(
                [
                  "프론트엔드",
                  "백엔드",
                  "데브옵스",
                  "인프라",
                  "데이터베이스",
                  "기타",
                ] as UiTagCategory[]
              ).map((cat) => (
                <button
                  key={cat}
                  className={`pb-1 border-b-2 ${
                    activeCategory === cat
                      ? "border-purple-500 font-semibold"
                      : "border-transparent text-gray-400"
                  }`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 태그 리스트 */}
          <div className="px-6 overflow-y-auto max-h-[220px]">
            {loading && (
              <div className="text-sm text-gray-400 px-2 py-1">
                불러오는 중…
              </div>
            )}
            {!loading && displayList.length === 0 && (
              <div className="text-sm text-gray-400 px-2 py-1">
                결과가 없어요.
              </div>
            )}
            <div className="flex justify-center flex-wrap gap-[24px] pb-4">
              {displayList.map((label, idx) => (
                <button
                  key={`${label}#${idx}`}
                  onClick={() => toggleTag(label)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    selectedTags.includes(label)
                      ? "bg-purple-100 text-purple-600 border-purple-400"
                      : "bg-gray-100 text-gray-600 border-gray-300"
                  }`}
                >
                  # {label}
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
              setRemoteTags([]);
            }}
            className="w-1/2 py-3 border border-gray-300 rounded-[12px] bg-white"
          >
            <span className="text-gray-500">초기화</span>
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
