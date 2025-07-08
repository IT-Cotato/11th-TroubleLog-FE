import { useState } from "react";
import useClickOutside from "../../hooks/useClickOutside";
import TagList from "../Card/TagList";
import KebabMenuButton from "../Menu/KebabMenuButton";
import KebabDropdown from "../Menu/KebabDropdown";

export interface ProjectFolderCardProps {
  id: string;
  name: string;
  description?: string;
  tags: string[];
}

export default function ProjectFolderCard({
  name,
  description,
  tags,
}: ProjectFolderCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  return (
    <div className="flex w-[384px] p-[16px] flex-col items-start gap-[10px] rounded-[8px] bg-white shadow-card">
      <div className="flex items-start self-stretch">
        <div className="flex items-center gap-[16px]">
          {/* 썸네일 자리 */}
          <div className="flex w-[100px] h-[100px] items-start rounded-[8px] bg-[rgba(217,217,217,0.5)]" />
          <div className="flex w-[228px] flex-col items-start gap-[18px]">
            {/* 제목 & 설명 영역 */}
            <div className="flex flex-col items-start gap-[4px] self-stretch">
              <span className="text-head-20-semibold">{name}</span>
              <span>{description}</span>
            </div>
            {/* 태그 */}
            <TagList tags={tags} />
          </div>
        </div>
        {/* 우측 상단 케밥 메뉴 */}
        <div ref={menuRef} className="relative">
          <KebabMenuButton onClick={() => setShowMenu(!showMenu)} />
          {showMenu && (
            <KebabDropdown
              options={[
                {
                  label: "폴더 수정",
                  onClick: () => {
                    setShowMenu(false);
                    console.log("폴더 수정 동작 실행");
                  },
                },
                {
                  label: "삭제",
                  onClick: () => {
                    setShowMenu(false);
                    console.log("삭제 동작 실행");
                  },
                },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
