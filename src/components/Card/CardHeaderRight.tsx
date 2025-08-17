import { useState } from "react";
import StatusDot from "./StatusDot";
import useClickOutside from "../../hooks/useClickOutside";
import KebabMenuButton from "../Menu/KebabMenuButton";
import KebabDropdown from "../Menu/KebabDropdown";
import type { StatusType } from "@/types/project";
import image from "@/assets/icons/image.svg";

interface CardHeaderRightProps {
  isMine: boolean;
  status: StatusType;
  authorProfileImageUrl?: string;
}

export default function CardHeaderRight({
  isMine,
  status,
  authorProfileImageUrl,
}: CardHeaderRightProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  // 카드 클릭으로 전파되지 않도록 막는 핸들러
  const stopCardClick = {
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
  };

  if (!isMine) {
    return (
      <img
        src={authorProfileImageUrl || image}
        alt="작성자 프로필"
        className="w-[28px] h-[28px] sm:w-[36px] sm:h-[36px] rounded-full"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div className="relative flex items-center gap-1 sm:gap-2" ref={menuRef}>
      <StatusDot status={status} />
      {status !== "inProgress" && (
        <div className="relative" {...stopCardClick}>
          <KebabMenuButton onClick={() => setShowMenu((v) => !v)} />

          {showMenu && (
            // 아이템 클릭 시 카드 onClick 방지
            <div {...stopCardClick}>
              <KebabDropdown
                options={[
                  {
                    label: "삭제",
                    onClick: () => {
                      setShowMenu(false);
                      console.log("삭제 동작 실행");
                    },
                  },
                ]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
