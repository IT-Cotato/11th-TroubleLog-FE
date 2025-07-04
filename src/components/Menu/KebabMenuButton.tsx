interface KebabMenuButtonProps {
  onClick?: () => void;
}

export default function KebabMenuButton({ onClick }: KebabMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]"
    >
      <img
        src="/icons/menu-kebab.svg"
        alt="케밥 메뉴"
        className="w-full h-full object-contain"
      />
    </button>
  );
}
