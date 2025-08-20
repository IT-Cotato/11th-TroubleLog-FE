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
      className="flex px-5 sm:px-10 py-3.5 sm:py-4 justify-center items-center rounded-xl border border-gray1 text-gray3 text-head-18-semibold sm:text-head-20-semibold disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
};

export default CancelButton;
