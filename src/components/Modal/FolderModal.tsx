import { useRef, useState, useEffect } from "react";
import BaseModal from "./BaseModal";
import CancelButton from "../Button/CancelButton";
import SaveButton from "../Button/SaveButton";
import { getProjectDetail } from "@/api/project.api";
import type { CreateProjectRequest } from "@/types/project.model";
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
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [syncing, setSyncing] = useState(false);

  const { uploading, progress, upload, reset: resetUpload } = useImageUpload();

  // edit 모드일 때 프로젝트 상세 조회 api 호출
  useEffect(() => {
    if (mode !== "edit" || !projectId) return;

    let isMounted = true;
    (async () => {
      try {
        setSyncing(true);
        const detail = await getProjectDetail(projectId);
        if (!isMounted) return;

        // 상세 응답으로 폼 값 덮어쓰기
        setName(detail.name ?? "");
        setDescription(detail.description ?? "");
        setThumbnailPreview(detail.thumbnailImageUrl ?? null);
        setSelectedFile(null);
        resetUpload();
      } catch (e) {
        console.error("프로젝트 상세 조회 실패:", e);
      } finally {
        if (isMounted) setSyncing(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [mode, projectId, resetUpload]);

  // blob URL 정리
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

    // 이전 blob URL 정리
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }

    setSelectedFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
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
    resetUpload();
  };

  const handleSubmit = async () => {
    if (disabled) return;

    try {
      // 선택된 새 파일이 있으면 업로드 -> URL 획득
      let thumbnailUrl = thumbnailPreview ?? "";
      if (selectedFile) {
        thumbnailUrl = await upload(selectedFile);
      }

      // 상위로 전달 (서버 URL 또는 빈 문자열)
      const payload: CreateProjectRequest = {
        name,
        description,
        thumbnailImageUrl: thumbnailUrl ?? "",
      };
      onSubmit?.(payload);
    } catch (err) {
      console.error("이미지 업로드/전송 실패:", err);
      alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const disabled = loading || syncing || uploading;

  return (
    <BaseModal
      onClose={onClose}
      width="w-[703px]"
      className="bg-white shadow-card"
    >
      {/* 헤더 */}
      <div className="flex justify-between items-center px-[36px] mb-[24px] mt-[36px] w-full">
        <span className="text-head-24-bold">
          {mode === "edit" ? "폴더 수정하기" : "새 폴더"}
        </span>
        <button onClick={onClose}>
          <img
            src={exitIcon}
            alt="close"
            className="w-[24px] h-[24px] mb-[12px] mt-[3px]"
          />
        </button>
      </div>

      {/* 구분선 */}
      <div className="w-full h-[1px] bg-gray1 mb-[32px]" />

      {/* 본문 */}
      <div className="flex justify-between items-center mb-[32px] px-[36px] w-full">
        {/* 썸네일 업로드 */}
        <div className="relative flex w-[186px] h-[186px] overflow-hidden flex-col justify-center items-center gap-[23px] rounded-[16px] border-dashed border-[2px] border-gray1 bg-[#FCFCFC]">
          {thumbnailPreview ? (
            <>
              <img
                src={thumbnailPreview}
                alt="thumbnail"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* 업로드 진행 표시(업로드 중에만) */}
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
                className="z-20 absolute bottom-[18px] flex px-[23px] pt-[10px] pb-[11px] rounded-[8px] border-[1.5px] border-gray1 bg-white"
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
                className="flex px-[17px] pt-[10px] pb-[11px] justify-center items-center rounded-[8px] border-[1.5px] border-gray1 bg-white"
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
        <div className="flex flex-col gap-[30px]">
          <div className="flex flex-col justify-center items-start gap-[8px]">
            <span className="text-head-20-semibold">폴더 이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
              className="flex pl-[15px] pt-[15px] pr-[230px] pb-[14px] items-center rounded-[8px] border border-gray1 bg-white text-body-14-regular"
              placeholder="폴더 이름을 입력해주세요."
            />
          </div>
          <div className="flex flex-col justify-center items-start gap-[8px]">
            <span className="text-head-20-semibold">한 줄 소개</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={disabled}
              className="flex pl-[15px] pt-[15px] pr-[230px] pb-[14px] items-center rounded-[8px] border border-gray1 bg-white text-body-14-regular"
              placeholder="한 줄 소개를 입력해주세요."
            />
          </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-end gap-[17px] mb-[24px] px-[36px] w-full">
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
