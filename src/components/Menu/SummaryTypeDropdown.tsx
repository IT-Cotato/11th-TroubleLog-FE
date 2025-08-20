import { useState } from "react";
import useClickOutside from "../../hooks/useClickOutside";
import dropdownIcon from "@/assets/icons/dropdown_icon.svg";
import type { ProjectTroubleSummaryType } from "@/types/trouble.model";

type Option = { label: string; value: ProjectTroubleSummaryType | null };

const OPTIONS: Option[] = [
  { label: "전체", value: null },
  { label: "자기소개서", value: "RESUME" },
  { label: "면접대비", value: "INTERVIEW" },
  { label: "블로그", value: "BLOG" },
  { label: "이슈관리", value: "ISSUE_MANAGEMENT" },
];

interface SummaryTypeDropdownProps {
  selected: ProjectTroubleSummaryType | null;
  onSelect: (value: ProjectTroubleSummaryType | null) => void;
}

export default function SummaryTypeDropdown({
  selected,
  onSelect,
}: SummaryTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  const selectedLabel =
    OPTIONS.find((o) => o.value === selected)?.label ?? "전체";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex justify-between items-center min-w-[80px] sm:min-w-[120px] px-4 py-[10px] rounded-[4px] border border-gray2 bg-white"
      >
        <span className="text-body-16-regular text-gray3">{selectedLabel}</span>
        <img
          src={dropdownIcon}
          className={`w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          alt="dropdown_icon"
        />
      </button>

      {open && (
        <div className="absolute top-[48px] sm:top-[52px] right-0 sm:left-0 sm:right-auto min-w-[120px] max-w-[92vw] max-h-[50vh] overflow-y-auto py-[8px] bg-white border border-gray2 rounded-[4px] shadow-card z-10">
          {OPTIONS.map((o, i) => (
            <div
              key={o.label}
              className={`px-4 py-2 sm:py-3 cursor-pointer hover:bg-gray1 ${
                i < OPTIONS.length - 1 ? "border-b border-gray1" : ""
              } ${selected === o.value ? "bg-gray1" : ""}`}
              onClick={() => {
                onSelect(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
