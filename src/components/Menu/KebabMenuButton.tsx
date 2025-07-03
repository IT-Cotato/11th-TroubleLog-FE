interface KebabMenuButtonProps {
  onClick?: () => void;
}

export default function KebabMenuButton({ onClick }: KebabMenuButtonProps) {
  return (
    <button onClick={onClick} className="w-[18px] h-[18px]">
      <img src="/icons/menu-kebab.svg" alt="케밥 메뉴" />
    </button>
  );
}
