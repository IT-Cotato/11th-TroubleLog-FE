interface KebabDropdownProps {
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function KebabDropdown({ onDelete }: KebabDropdownProps) {
  return (
    <div className="flex absolute right-0 top-6 w-[118px] h-[36px] rounded-[8px] bg-white shadow-card z-[10]">
      <button
        onClick={onDelete}
        className="w-full h-full rounded-[8px] text-center text-body-16-regular hover:bg-gray1"
      >
        삭제
      </button>
    </div>
  );
}
