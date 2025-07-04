interface StatusFilterButtonProps {
  label: "작성 완료" | "요약 완료";
  statusKey: "complete" | "created";
  isSelected: boolean;
  onClick: () => void;
}

export default function StatusFilterButton({
  label,
  statusKey,
  isSelected,
  onClick,
}: StatusFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex h-[32px] sm:h-[38px] py-[4px] sm:py-[6px] px-[8px] sm:px-[10px] justify-center items-center gap-[2px] rounded-[20px] ${
        isSelected ? "bg-subColor1" : "bg-gray1"
      }`}
    >
      <div className="flex items-center gap-[6px] sm:gap-[8px]">
        <div
          className={`w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] rounded-full ${
            statusKey === "complete"
              ? "bg-status-complete"
              : "bg-status-created"
          }`}
        />
        <span className="text-body-20-regular">{label}</span>
      </div>
    </button>
  );
}
