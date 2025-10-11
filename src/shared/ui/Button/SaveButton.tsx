interface SaveButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const SaveButton = ({
  onClick,
  label = "저장",
  disabled = false,
  type = "button",
}: SaveButtonProps) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className="flex px-5 sm:px-10 py-3.5 sm:py-4 justify-center items-center rounded-xl bg-primary text-white text-head-18-semibold sm:text-head-20-semibold disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
};

export default SaveButton;
