import { useRef, useState, useEffect } from "react";
import BaseModal from "./BaseModal";
import CancelButton from "../Button/CancelButton";
import SaveButton from "../Button/SaveButton";
import { getProjectDetail } from "@/api/project.api";
import type { CreateProjectRequest } from "@/types/project.model";

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
  const [thumbnail, setThumbnail] = useState<string | null>(initialThumbnail);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [syncing, setSyncing] = useState(false);

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
        setThumbnail(detail.thumbnailImageUrl ?? null);
      } catch (e) {
        console.error("프로젝트 상세 조회 실패:", e);
      } finally {
        if (isMounted) setSyncing(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [mode, projectId]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (thumbnail && thumbnail.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnail);
      }
      const imageUrl = URL.createObjectURL(file);
      setThumbnail(imageUrl);
    }
  };

  useEffect(() => {
    return () => {
      if (thumbnail && thumbnail.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnail);
      }
    };
  }, [thumbnail]);

  const handleUploadClick = () => {
    if (loading || syncing) return;
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (loading || syncing) return;

    const payload: CreateProjectRequest = {
      name,
      description,
      thumbnailImageUrl: thumbnail ?? "",
    };
    onSubmit?.(payload);
  };

  const disabled = loading || syncing;

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
            src="/icons/exiticon.svg"
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
          {thumbnail ? (
            <>
              <img
                src={thumbnail}
                alt="thumbnail"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <button
                onClick={() => setThumbnail(null)}
                disabled={disabled}
                className="z-20 absolute bottom-[18px] flex px-[23px] pt-[10px] pb-[11px] rounded-[8px] border-[1.5px] border-gray1 bg-white"
              >
                <span className="text-body-14-regular">썸네일 삭제</span>
              </button>
            </>
          ) : (
            <>
              <img
                src="/icons/add_image.svg"
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
          label={syncing ? "불러오는 중..." : loading ? "저장 중..." : "완료"}
          disabled={disabled}
        />
      </div>
    </BaseModal>
  );
}
