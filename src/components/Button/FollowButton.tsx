interface ButtonProps {
  label: string;
  colorClass: string;
  onClick?: () => void;
}

const FollowButton = ({ label, colorClass, onClick }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-[296px] h-[42px] py-[9px] justify-center items-center rounded-[10px] text-head-20-semibold ${colorClass} text-white`}
    >
      {label}
    </button>
  );
};

export default FollowButton;
