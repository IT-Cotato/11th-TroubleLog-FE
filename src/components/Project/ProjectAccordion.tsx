import { useId, useState } from "react";

interface ProjectAccordionProps {
  title: React.ReactNode;
  headerExtra?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function ProjectAccordion({
  title,
  headerExtra,
  defaultOpen = true,
  children,
}: ProjectAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="flex flex-col w-full">
      {/* 헤더: 좌측 토글 버튼 + 우측 액션 */}
      <div className="flex items-stretch gap-[8px] sm:gap-[12px] mb-[24px] sm:mb-[36px] h-9 sm:h-[36px]">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-[8px] sm:gap-[12px]"
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <img
            src="/icons/arrow-forward.svg"
            alt=""
            aria-hidden
            className={`w-[28px] h-[28px] sm:w-[36px] sm:h-[36px] transition-transform duration-200 ${
              isOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
          {typeof title === "string" ? (
            <span className="text-head-32-regular">{title}</span>
          ) : (
            title
          )}
        </button>

        {/* 우측 액션 */}
        {headerExtra ? <div>{headerExtra}</div> : null}
      </div>

      {/* 펼쳐진 내용 */}
      <div
        id={panelId}
        aria-hidden={!isOpen}
        className={
          (isOpen ? "flex" : "hidden") + " flex-col gap-[36px] sm:gap-[60px]"
        }
      >
        {children}
      </div>
    </div>
  );
}
