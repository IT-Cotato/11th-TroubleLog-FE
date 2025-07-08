interface SaveButtonProps {
  onClick: () => void;
  label?: string;
}

const SaveButton = ({ onClick, label = "저장" }: SaveButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex px-[57px] py-4 justify-center items-center rounded-xl bg-primary text-white text-head-20-semibold"
    >
      {label}
    </button>
  );
};

export default SaveButton;
