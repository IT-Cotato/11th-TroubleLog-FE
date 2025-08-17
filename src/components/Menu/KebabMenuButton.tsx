// KebabMenuButton.tsx
import kebabIcon from "@/assets/icons/menu-kebab.svg";

type HitArea = "compact" | "comfortable" | "spacious";

interface KebabMenuButtonProps {
  onClick?: () => void;
  iconSize?: number;
  hitArea?: HitArea;
  className?: string;
  ariaLabel?: string;
}

const hitAreaClass: Record<HitArea, string> = {
  compact: "-m-1 p-1",
  comfortable: "-m-2 p-2",
  spacious: "-m-3 p-3",
};

export default function KebabMenuButton({
  onClick,
  iconSize = 18,
  hitArea = "comfortable",
  className = "",
  ariaLabel = "케밥 메뉴",
}: KebabMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        "inline-flex items-center justify-center rounded-full",
        "hover:bg-gray-100",
        hitAreaClass[hitArea],
        className,
      ].join(" ")}
    >
      <img
        src={kebabIcon}
        alt=""
        aria-hidden="true"
        style={{ width: iconSize, height: iconSize }}
        className="shrink-0"
      />
    </button>
  );
}
