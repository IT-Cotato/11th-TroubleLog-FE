import { useState, useCallback, useEffect } from "react";
import useClickOutside from "../../../hooks/useClickOutside";
import TagList from "../../trouble/ui/TagList";
import KebabMenuButton from "../../../shared/ui/Menu/KebabMenuButton";
import KebabDropdown from "../../../shared/ui/Menu/KebabDropdown";
import FolderModal from "../../../shared/ui/Modal/FolderModal";
import ConfirmDeleteModal from "../../../shared/ui/Modal/ConfirmDeleteModal";
import type { UpdateProjectRequest } from "@/types/project.model";
import { deleteProject, putUpdateProject } from "@/api/project.api";
import { Link } from "react-router-dom";

export interface ProjectFolderCardProps {
  id: number;
  name: string;
  description?: string;
  tags: string[];
  thumbnail?: string | null;
  onUpdated?: () => void;
  onDeleted?: () => void;
  to?: string;
  linkState?: unknown;
}

export default function ProjectFolderCard({
  id,
  name,
  description = "",
  tags,
  thumbnail,
  onUpdated,
  onDeleted,
  to,
  linkState,
}: ProjectFolderCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  useEffect(() => {
    if (!showMenu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMenu(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showMenu]);

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

  const handleEditSubmit = useCallback(
    async (data: UpdateProjectRequest) => {
      try {
        setLoading(true);
        const body: UpdateProjectRequest = {
          name: data.name.trim(),
          description: data.description.trim(),
        };
        if (data.thumbnailImageUrl !== undefined) {
          const v = data.thumbnailImageUrl.trim();
          if (v !== "") body.thumbnailImageUrl = v;
        }
        await putUpdateProject(id, body);
        setShowEditModal(false);
        onUpdated?.();
      } catch (err) {
        console.error("프로젝트 수정 실패:", err);
      } finally {
        setLoading(false);
      }
    },
    [id, onUpdated]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      setLoading(true);
      await deleteProject(id);
      setShowDeleteModal(false);
      onDeleted?.();
    } catch (err) {
      console.error("프로젝트 삭제 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [id, onDeleted]);

  // 카드 본문(링크 영역)
  const CardMain = (
    <div className="flex items-center gap-3 sm:gap-[16px] min-w-0">
      {/* 썸네일: 모바일에서 작게, sm 이상 기존 크기 */}
      <div className="flex w-16 h-16 sm:w-[100px] sm:h-[100px] items-center justify-center rounded-[8px] bg-[rgba(217,217,217,0.5)] overflow-hidden shrink-0">
        {thumbnail && (
          <img
            src={thumbnail}
            alt="thumbnail"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 텍스트 영역: 고정 폭 제거 + 줄바꿈/잘림 안전 */}
      <div className="flex-1 min-w-0 flex flex-col items-start gap-3 sm:gap-[18px]">
        <div className="flex flex-col items-start gap-1 self-stretch min-w-0 ">
          <span className="text-head-20-semibold block truncate" title={name}>
            {name}
          </span>
          <span className="text-body-14-regular text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
            {description}
          </span>
        </div>
        {/* 태그: 래퍼로 overflow 보호 */}
        <div className="w-full min-w-0 overflow-hidden">
          <TagList tags={tags} />
        </div>
      </div>
    </div>
  );

  // 케밥 메뉴(링크 바깥)
  const KebabArea = (
    <div
      ref={menuRef}
      className="relative shrink-0 ml-2"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <KebabMenuButton
        onClick={() => setShowMenu((v) => !v)}
        iconSize={16}
        hitArea="comfortable"
      />
      {showMenu && (
        <KebabDropdown
          options={[
            { label: "폴더 수정", onClick: handleEdit },
            { label: "삭제", onClick: handleDelete },
          ]}
        />
      )}
    </div>
  );

  const ContainerClasses =
    "flex flex-none p-[16px] flex-col items-start gap-[10px] rounded-[8px] bg-white shadow-card w-[300px] sm:w-[332px] md:w-[360px] lg:w-[384px]";

  return (
    <>
      <div className={ContainerClasses}>
        <div className="flex items-start self-stretch min-w-0">
          {to ? (
            <Link
              to={to}
              state={linkState}
              className="flex-1 min-w-0"
              aria-label={`${name} 프로젝트로 이동`}
            >
              {CardMain}
            </Link>
          ) : (
            <div className="flex-1 min-w-0">{CardMain}</div>
          )}
          {KebabArea}
        </div>
      </div>

      {/* 프로젝트 폴더 수정 모달 */}
      {showEditModal && (
        <FolderModal
          mode="edit"
          projectId={id}
          onClose={handleModalClose}
          onSubmit={handleEditSubmit}
          loading={loading}
        />
      )}

      {/* 프로젝트 폴더 삭제 모달 */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          onClose={handleDeleteModalClose}
          onConfirm={handleDeleteConfirm}
          title="프로젝트 삭제"
          description={`정말 삭제하시겠습니까?\n삭제 후 복구되지 않습니다.`}
          loading={loading}
        />
      )}
    </>
  );
}
