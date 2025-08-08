interface SaveButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

const SaveButton = ({
  onClick,
  label = "저장",
  disabled = false,
}: SaveButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex px-[57px] py-4 justify-center items-center rounded-xl bg-primary text-white text-head-20-semibold"
    >
      {label}
    </button>
  );
};

export default SaveButton;
