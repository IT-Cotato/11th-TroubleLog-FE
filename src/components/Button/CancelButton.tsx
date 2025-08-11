interface CancelButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

const CancelButton = ({
  onClick,
  label = "취소",
  disabled = false,
}: CancelButtonProps) => {
  return (
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      className="flex px-[57px] py-4 justify-center items-center rounded-xl border border-gray1 text-gray3 text-head-20-semibold"
    >
      {label}
    </button>
  );
};

export default CancelButton;
