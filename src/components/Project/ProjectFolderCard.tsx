import { useState, useCallback } from "react";
import useClickOutside from "../../hooks/useClickOutside";
import TagList from "../Card/TagList";
import KebabMenuButton from "../Menu/KebabMenuButton";
import KebabDropdown from "../Menu/KebabDropdown";
import FolderModal from "../Modal/FolderModal";
import ConfirmDeleteModal from "../Modal/ConfirmDeleteModal";

export interface ProjectFolderCardProps {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  thumbnailUrl?: string;
}

export default function ProjectFolderCard({
  name,
  description = "",
  tags,
  thumbnailUrl,
}: ProjectFolderCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  const handleEdit = useCallback(() => {
    setShowMenu(false);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(() => {
    setShowMenu(false);
    setShowDeleteModal(true);
  }, []);

  const handleModalClose = useCallback(() => setShowEditModal(false), []);
  const handleDeleteModalClose = useCallback(
    () => setShowDeleteModal(false),
    []
  );
  const handleDeleteConfirm = useCallback(() => {
    console.log("삭제 확정");
    setShowDeleteModal(false);
  }, []);

  return (
    <>
      <div className="flex w-[384px] p-[16px] flex-col items-start gap-[10px] rounded-[8px] bg-white shadow-card">
        <div className="flex items-start self-stretch">
          <div className="flex items-center gap-[16px]">
            {/* 썸네일 자리 */}
            <div className="flex w-[100px] h-[100px] items-center justify-center rounded-[8px] bg-[rgba(217,217,217,0.5)] overflow-hidden">
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt="thumbnail"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
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
                    onClick: handleEdit,
                  },
                  {
                    label: "삭제",
                    onClick: handleDelete,
                  },
                ]}
              />
            )}
          </div>
        </div>
      </div>

      {/* 폴더 수정 모달 */}
      {showEditModal && (
        <FolderModal
          mode="edit"
          onClose={handleModalClose}
          initialName={name}
          initialDescription={description}
          initialThumbnail={thumbnailUrl ?? null}
          onSubmit={(data) => {
            console.log("수정된 폴더 데이터:", data);
            setShowEditModal(false);
          }}
        />
      )}

      {/* 폴더 삭제 모달 */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          onClose={handleDeleteModalClose}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}
