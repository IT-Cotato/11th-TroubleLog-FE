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

  // edit 모드일 때 프로젝트 상세 조회 api 호출
  useEffect(() => {
    if (mode !== "edit" || !projectId) return;

    let alive = true;
    (async () => {
      try {
        setSyncing(true);

        // StrictMode/동시 호출 디듀프
        const detail = await fetchProjectDetailOnce(projectId);
        if (!alive) return;

        // 삭제된 프로젝트 방어는 상태 갱신 전에
        if (detail.isDeleted) {
          alert("삭제된 프로젝트입니다. 목록으로 돌아갑니다.");
          onClose();
          return;
        }

        // 상세 응답으로 폼 값 덮어쓰기
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

    // 이름 유효성
    if (!name.trim()) {
      alert("프로젝트 이름을 입력해주세요.");
      return;
    }

    try {
      // 선택된 새 파일이 있으면 업로드 -> URL 획득
      let uploadedUrl: string | undefined;
      if (selectedFile) {
        uploadedUrl = await upload(selectedFile);
      }

      // 상위로 전달 (서버 URL 또는 빈 문자열)
      const payload: CreateProjectRequest = {
        name: name.trim(),
        description: description.trim(),
      };

      if (mode === "new") {
        // 새 프로젝트: URL이 있으면 포함, 없으면 생략
        if (uploadedUrl && uploadedUrl.trim() !== "") {
          payload.thumbnailImageUrl = uploadedUrl.trim();
        }
      } else {
        // 수정 모드
        if (uploadedUrl && uploadedUrl.trim() !== "") {
          // 새 이미지 업로드 -> 교체
          payload.thumbnailImageUrl = uploadedUrl.trim();
        } else if (removed) {
          // 삭제 버튼 클릭 -> 빈 문자열로 제거 의사 전달
          payload.thumbnailImageUrl = "";
        }
        // 아무 조작 없음 -> 생략
      }

      onSubmit?.(payload);
    } catch (err) {
      console.error("이미지 업로드/전송 실패:", err);
      // 에러 타입에 따른 구체적인 메시지
      const message =
        err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.";
      alert(message);
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
