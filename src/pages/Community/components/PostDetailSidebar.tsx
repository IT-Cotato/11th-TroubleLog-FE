export interface PostDetailSidebarProps {
  questions: string[];
  currentSection: number;
  onSectionClick: (idx: number) => void;
  headerOffset: number;
  asideOffset: number;
}

/**
 * 커뮤니티 포스트 상세 목차(TOC) 사이드바 — 큰 화면에서만 표시
 */
export function PostDetailSidebar({
  questions,
  currentSection,
  onSectionClick,
  headerOffset,
  asideOffset,
}: PostDetailSidebarProps) {
  return (
    <aside
      className="hidden xl:block h-fit w-[220px] 2xl:w-[280px] sticky"
      style={{ top: headerOffset, marginTop: asideOffset }}
    >
      <div className="flex flex-col items-start gap-[16px] border-l border-gray3 pl-[12px] pr-[8px] text-body-20-regular text-gray3 w-full">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSectionClick(idx)}
            className={`text-left ${
              currentSection === idx ? "text-black" : ""
            }`}
          >
            {idx + 1}. {q}
          </button>
        ))}
      </div>
    </aside>
  );
}
