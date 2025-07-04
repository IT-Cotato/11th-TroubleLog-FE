import { useState } from "react";

interface ProjectAccordionProps {
  projectName: string;
  children: React.ReactNode;
}

export default function ProjectAccordion({
  projectName,
  children,
}: ProjectAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col w-full">
      {/* 아코디언 버튼 */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-[8px] sm:gap-[12px] mb-[24px] sm:mb-[36px]"
      >
        <img
          src="/icons/arrow-forward.svg"
          alt="arrow"
          className={`w-[28px] h-[28px] sm:w-[36px] sm:h-[36px] transition-transform duration-200 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
        <span className="text-head-32-regular">{projectName}</span>
      </button>

      {/* 펼쳐진 내용 */}
      {isOpen && (
        <div className="flex flex-col gap-[36px] sm:gap-[60px]">{children}</div>
      )}
    </div>
  );
}
