import { useState } from "react";
import StatusDot from "@/entities/trouble/ui/StatusDot";
import useClickOutside from "@/hooks/useClickOutside";
import KebabMenuButton from "@/shared/ui/Menu/KebabMenuButton";
import KebabDropdown from "@/shared/ui/Menu/KebabDropdown";
import type { StatusType } from "@/types/project";
import image from "@/assets/icons/image.svg";

interface CardHeaderRightProps {
  isMine: boolean;
  status: StatusType;
  authorProfileImageUrl?: string;
  onAvatarClick?: () => void;
  onDelete?: () => void;
  deleting?: boolean;

  hasSummary?: boolean;
  onDeleteSummary?: () => void;
  summaryDeleting?: boolean;
}

export default function CardHeaderRight({
  isMine,
  status,
  authorProfileImageUrl,
  onAvatarClick,
  onDelete,
  deleting = false,
  hasSummary,
  onDeleteSummary,
  summaryDeleting = false,
}: CardHeaderRightProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  const stopCardClick = {
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  };

  if (!isMine) {
    return (
      <img
        src={authorProfileImageUrl || image}
        alt="작성자 프로필"
        loading="lazy"
        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full ring-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/50"
        role="button"
        tabIndex={0}
        aria-label="작성자 프로필 보기"
        onClick={(e) => {
          e.stopPropagation();
          onAvatarClick?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onAvatarClick?.();
          }
        }}
      />
    );
  }

  const options: { label: string; onClick: () => void }[] = [];

  if (hasSummary && onDeleteSummary) {
    options.push({
      label: summaryDeleting ? "요약본 삭제 중..." : "요약본 삭제",
      onClick: () => {
        if (!summaryDeleting) onDeleteSummary();
      },
    });
  }

  options.push({
    label: deleting
      ? "삭제 중..."
      : hasSummary
        ? "삭제"
        : "삭제(원본 삭제)",
    onClick: () => {
      if (!deleting) onDelete?.();
    },
  });

  return (
    <div className="relative flex gap-1 sm:gap-2" ref={menuRef}>
      <StatusDot status={status} />
      <div className="relative" {...stopCardClick}>
        <KebabMenuButton
          onClick={() => {
            if (deleting || summaryDeleting) return;
            setShowMenu((v) => !v);
          }}
        />
        {showMenu && (
          <div {...stopCardClick}>
            <KebabDropdown options={options} />
          </div>
        )}
      </div>
    </div>
  );
}
