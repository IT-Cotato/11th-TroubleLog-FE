import kebabIcon from "@/assets/icons/menu-kebab.svg";

interface KebabMenuButtonProps {
  onClick?: () => void;
}

export default function KebabMenuButton({ onClick }: KebabMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        inline-flex items-center justify-center
        -m-2 p-2                 
        rounded-full hover:bg-gray-100
      "
    >
      <img
        src={kebabIcon}
        alt="케밥 메뉴"
        className="w-full h-full object-contain"
      />
    </button>
  );
}
