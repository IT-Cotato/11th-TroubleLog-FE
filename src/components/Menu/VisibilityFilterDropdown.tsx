import { useState, useRef, useEffect } from "react";

interface VisibilityFilterDropdownProps {
  selected: "전체" | "공개" | "비공개";
  onSelect: (value: "전체" | "공개" | "비공개") => void;
}

export default function VisibilityFilterDropdown({
  selected,
  onSelect,
}: VisibilityFilterDropdownProps) {
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

  const options: ("전체" | "공개" | "비공개")[] = ["전체", "공개", "비공개"];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex pt-[12px] pr-[12px] pb-[12px] pl-[16px] justify-between items-center w-[120px] rounded-[4px] border border-gray2 bg-white"
      >
        <span className="text-body-16-regular text-gray3">{selected}</span>
        <img
          src="/icons/dropdown_icon.svg"
          className={`w-[24px] h-[24px] transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          alt="dropdown_icon"
        />
      </button>
      {open && (
        <div className="absolute top-[52px] left-0 w-full py-[8px] bg-white border border-gray2 rounded-[4px] shadow-card z-10">
          {options.map((option) => (
            <div
              key={option}
              className={`px-4 py-3 cursor-pointer hover:bg-gray1 ${
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
