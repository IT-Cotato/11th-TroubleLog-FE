import { useState, useCallback, useEffect } from "react";
import useClickOutside from "../../hooks/useClickOutside";
import TagList from "../Card/TagList";
import KebabMenuButton from "../Menu/KebabMenuButton";
import KebabDropdown from "../Menu/KebabDropdown";
import FolderModal from "../Modal/FolderModal";
import ConfirmDeleteModal from "../Modal/ConfirmDeleteModal";
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

  // ESC로 드롭다운 닫기
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

  // 수정 api 호출
  const handleEditSubmit = useCallback(
    async (data: UpdateProjectRequest) => {
      try {
        setLoading(true);

        const body: UpdateProjectRequest = {
          name: data.name.trim(),
          description: data.description.trim(),
        };

        // 썸네일이 넘어왔을 때만 판단
        if (data.thumbnailImageUrl !== undefined) {
          const v = data.thumbnailImageUrl.trim();
          if (v !== "") {
            // 교체: 값 포함
            body.thumbnailImageUrl = v;
          }
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

  // 카드 본문(링크 영역)
  const CardMain = (
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
  );

  // 케밥 메뉴(링크 바깥)
  const KebabArea = (
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
  );

  const ContainerClasses =
    "flex w-[384px] p-[16px] flex-col items-start gap-[10px] rounded-[8px] bg-white shadow-card";

  return (
    <>
      <div className={ContainerClasses}>
        <div className="flex items-start self-stretch">
          {to ? (
            <Link
              to={to}
              state={linkState}
              className="flex-1"
              aria-label={`${name} 프로젝트로 이동`}
            >
              {CardMain}
            </Link>
          ) : (
            <div className="flex-1">{CardMain}</div>
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
