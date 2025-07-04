import { useState, useRef, useEffect } from "react";

interface SummaryTypeDropdownProps {
  selected: string;
  onSelect: (value: string) => void;
}

const OPTIONS = ["전체", "자기소개서", "면접대비", "블로그", "이슈관리"];

export default function SummaryTypeDropdown({
  selected,
  onSelect,
}: SummaryTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex justify-between items-center min-w-[80px] sm:min-w-[120px] px-4 py-[10px] rounded-[4px] border border-gray2 bg-white"
      >
        <span className="text-body-16-regular text-gray3">{selected}</span>
        <img
          src="/icons/dropdown_icon.svg"
          className={`w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          alt="dropdown_icon"
        />
      </button>
      {open && (
        <div className="absolute top-[48px] sm:top-[52px] left-0 min-w-[100px] sm:min-w-[120px] py-[8px] bg-white border border-gray2 rounded-[4px] shadow-card z-10 overflow-hidden">
          {OPTIONS.map((option) => (
            <div
              key={option}
              className={`px-4 py-2 sm:py-3 cursor-pointer hover:bg-gray1 border-b border-gray1 ${
                selected === option ? "bg-gray1" : ""
              }`}
              onClick={() => {
                onSelect(option);
                setOpen(false);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
