interface ButtonProps {
  label: string;
  colorClass: string;
  onClick?: () => void;
}

const FollowButton = ({ label, colorClass, onClick }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex w-full md:w-[296px] min-h-10 sm:min-h-11 md:h-[42px] px-4 justify-center items-center rounded-[10px] text-head-20-semibold ${colorClass} text-white`}
    >
      {label}
    </button>
  );
};

export default FollowButton;
