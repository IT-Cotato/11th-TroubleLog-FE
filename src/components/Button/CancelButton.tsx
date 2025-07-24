interface CancelButtonProps {
  onClick: () => void;
  label?: string;
}

const CancelButton = ({ onClick }: CancelButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex px-[57px] py-4 justify-center items-center rounded-xl border border-gray1 text-gray3 text-head-20-semibold"
    >
      취소
    </button>
  );
};

export default CancelButton;
