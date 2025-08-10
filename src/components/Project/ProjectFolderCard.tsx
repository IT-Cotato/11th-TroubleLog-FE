import { useState, useCallback } from "react";
import useClickOutside from "../../hooks/useClickOutside";
import TagList from "../Card/TagList";
import KebabMenuButton from "../Menu/KebabMenuButton";
import KebabDropdown from "../Menu/KebabDropdown";
import FolderModal from "../Modal/FolderModal";
import ConfirmDeleteModal from "../Modal/ConfirmDeleteModal";
import type { CreateProjectRequest } from "@/types/project.model";
import { deleteProject, putUpdateProject } from "@/api/project.api";
import { Link } from "react-router-dom";

export interface ProjectFolderCardProps {
  id: number;
  name: string;
  description?: string;
  tags: string[];
  thumbnail?: string;
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

  // 수정 api 호출
  const handleEditSubmit = useCallback(
    async (data: CreateProjectRequest) => {
      try {
        setLoading(true);
        await putUpdateProject(id, data);
        console.log("프로젝트 수정 완료");
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

  // 삭제 api 호출
  const handleDeleteConfirm = useCallback(async () => {
    try {
      setLoading(true);
      await deleteProject(id);
      console.log("프로젝트 삭제 완료");
      setShowDeleteModal(false);
      onDeleted?.();
    } catch (err) {
      console.error("프로젝트 삭제 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [id, onDeleted]);

  // 카드 본문
  const CardBody = (
    <div className="flex items-start self-stretch">
      <div className="flex items-center gap-[16px]">
        {/* 썸네일 */}
        <div className="flex w-[100px] h-[100px] items-center justify-center rounded-[8px] bg-[rgba(217,217,217,0.5)] overflow-hidden">
          {thumbnail && (
            <img
              src={thumbnail}
              alt="thumbnail"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex w-[228px] flex-col items-start gap-[18px]">
          <div className="flex flex-col items-start gap-[4px] self-stretch">
            <span className="text-head-20-semibold">{name}</span>
            <span>{description}</span>
          </div>
          <TagList tags={tags} />
        </div>
      </div>
      {/* 케밥 메뉴: 링크 내에서도 클릭 시 네비게이션 막기 */}
      <div
        ref={menuRef}
        className="relative"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <KebabMenuButton onClick={() => setShowMenu((v) => !v)} />
        {showMenu && (
          <KebabDropdown
            options={[
              { label: "폴더 수정", onClick: handleEdit },
              { label: "삭제", onClick: handleDelete },
            ]}
          />
        )}
      </div>
    </div>
  );

  const ContainerClasses =
    "flex w-[384px] p-[16px] flex-col items-start gap-[10px] rounded-[8px] bg-white shadow-card hover:shadow-lg transition";

  return (
    <>
      {to ? (
        // 링크로 감싸서 이동
        <Link
          to={to}
          state={linkState}
          className={ContainerClasses}
          aria-label={`${name} 프로젝트로 이동`}
        >
          {CardBody}
        </Link>
      ) : (
        // 링크가 없으면 그냥 div
        <div className={ContainerClasses}>{CardBody}</div>
      )}

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
