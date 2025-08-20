import { useRef, useState, useEffect } from "react";
import BaseModal from "./BaseModal";
import CancelButton from "../Button/CancelButton";
import SaveButton from "../Button/SaveButton";
import { getProjectDetail } from "@/api/project.api";
import type {
  CreateProjectRequest,
  ProjectDetail,
} from "@/types/project.model";
import exitIcon from "@/assets/icons/exiticon.svg";
import addImageIcon from "@/assets/icons/add_image.svg";
import useImageUpload from "@/utils/useImageUpload";

interface FolderModalProps {
  mode: "new" | "edit";
  projectId?: number;
  onClose: () => void;
  onSubmit?: (data: CreateProjectRequest) => void;
  initialName?: string;
  initialDescription?: string;
  initialThumbnail?: string | null;
  loading?: boolean;
}

const detailInflight = new Map<number, Promise<ProjectDetail>>();
function fetchProjectDetailOnce(id: number) {
  if (!detailInflight.has(id)) {
    detailInflight.set(
      id,
      getProjectDetail(id).finally(() => detailInflight.delete(id))
    );
  }
  return detailInflight.get(id)!;
}

export default function FolderModal({
  mode,
  projectId,
  onClose,
  onSubmit,
  initialName = "",
  initialDescription = "",
  initialThumbnail = null,
  loading = false,
}: FolderModalProps) {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialThumbnail
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [syncing, setSyncing] = useState(false);

  const { uploading, progress, upload, reset: resetUpload } = useImageUpload();

  useEffect(() => {
    if (mode !== "edit" || !projectId) return;
    let alive = true;
    (async () => {
      try {
        setSyncing(true);
        const detail = await fetchProjectDetailOnce(projectId);
        if (!alive) return;
        if (detail.isDeleted) {
          alert("삭제된 프로젝트입니다. 목록으로 돌아갑니다.");
          onClose();
          return;
        }
        setName(detail.name ?? "");
        setDescription(detail.description ?? "");
        setThumbnailPreview(detail.thumbnailImageUrl ?? null);
        setSelectedFile(null);
        setRemoved(false);
        resetUpload();
      } catch (e) {
        if (alive) console.error("프로젝트 상세 조회 실패:", e);
      } finally {
        if (alive) setSyncing(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode, projectId, onClose]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setSelectedFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setRemoved(false);
    resetUpload();
  };

  const handleUploadClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleRemoveThumb = () => {
    if (disabled) return;
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(null);
    setSelectedFile(null);
    setRemoved(true);
    resetUpload();
  };

  const handleSubmit = async () => {
    if (disabled) return;
    if (!name.trim()) {
      alert("프로젝트 이름을 입력해주세요.");
      return;
    }
    try {
      let uploadedUrl: string | undefined;
      if (selectedFile) {
        uploadedUrl = await upload(selectedFile);
      }
      const payload: CreateProjectRequest = {
        name: name.trim(),
        description: description.trim(),
      };
      if (mode === "new") {
        if (uploadedUrl && uploadedUrl.trim() !== "")
          payload.thumbnailImageUrl = uploadedUrl.trim();
      } else {
        if (uploadedUrl && uploadedUrl.trim() !== "")
          payload.thumbnailImageUrl = uploadedUrl.trim();
        else if (removed) payload.thumbnailImageUrl = "";
      }
      onSubmit?.(payload);
    } catch (err) {
      console.error("이미지 업로드/전송 실패:", err);
      const message =
        err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.";
      alert(message);
    }
  };

  const disabled = loading || syncing || uploading;

  return (
    <BaseModal
      onClose={onClose}
      width="w-[min(703px,92vw)]"
      className="bg-white shadow-card"
    >
      {/* 헤더 */}
      <div className="flex justify-between items-center px-6 mb-6 mt-9 w-full">
        <span className="text-head-24-bold">
          {mode === "edit" ? "폴더 수정하기" : "새 폴더"}
        </span>
        <button onClick={onClose} aria-label="닫기">
          <img src={exitIcon} alt="close" className="w-6 h-6 mb-3 mt-[3px]" />
        </button>
      </div>
      <div className="w-full h-px bg-gray1 mb-8" />

      {/* 본문: 모바일 세로, md+ 가로 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8 mb-8 px-6 w-full">
        {/* 썸네일 업로드 */}
        <div className="relative flex w-40 h-40 sm:w-44 sm:h-44 md:w-[186px] md:h-[186px] overflow-hidden flex-col justify-center items-center gap-6 rounded-[16px] border-dashed border-2 border-gray1 bg-[#FCFCFC] mx-auto md:mx-0">
          {thumbnailPreview ? (
            <>
              <img
                src={thumbnailPreview}
                alt="thumbnail"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-body-14-regular">
                    업로드 중… {progress}%
                  </span>
                </div>
              )}
              <button
                onClick={handleRemoveThumb}
                disabled={disabled}
                className="z-20 absolute bottom-4 flex px-6 py-2 rounded-[8px] border border-gray1 bg-white"
              >
                <span className="text-body-14-regular">썸네일 삭제</span>
              </button>
            </>
          ) : (
            <>
              <img
                src={addImageIcon}
                alt="add_image"
                className="w-[52px] h-[52px]"
              />
              <button
                onClick={handleUploadClick}
                disabled={disabled}
                className="flex px-4 py-2 justify-center items-center rounded-[8px] border border-gray1 bg-white"
              >
                <span className="text-body-14-regular">썸네일 업로드</span>
              </button>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* 입력 영역 */}
        <div className="flex-1 w-full grid grid-cols-1 gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-head-20-semibold">폴더 이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
              className="w-full rounded-[8px] border border-gray1 bg-white text-body-14-regular px-4 py-3"
              placeholder="폴더 이름을 입력해주세요."
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-head-20-semibold">한 줄 소개</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={disabled}
              className="w-full rounded-[8px] border border-gray1 bg-white text-body-14-regular px-4 py-3"
              placeholder="한 줄 소개를 입력해주세요."
            />
          </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-end gap-4 mb-6 px-6 w-full">
        <CancelButton onClick={onClose} />
        <SaveButton
          onClick={handleSubmit}
          label={
            syncing
              ? "불러오는 중..."
              : uploading
              ? `업로드 중... ${progress}%`
              : loading
              ? "저장 중..."
              : "완료"
          }
          disabled={disabled}
        />
      </div>
    </BaseModal>
  );
}
