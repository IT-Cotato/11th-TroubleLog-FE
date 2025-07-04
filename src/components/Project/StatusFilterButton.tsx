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
      className={`flex h-[38px] py-[6px] px-[10px] justify-center items-center gap-[2px] rounded-[20px] ${
        isSelected ? "bg-subColor1" : "bg-gray1"
      }`}
    >
      <div className="flex items-center gap-[8px]">
        <div
          className={`w-[18px] h-[18px] rounded-full bg-status-${statusKey}`}
        />
        <span className="text-body-20-regular">{label}</span>
      </div>
    </button>
  );
}
