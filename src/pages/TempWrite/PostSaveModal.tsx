import { useState, useRef, useEffect, useMemo } from "react";
import BaseModal from "../../components/Modal/BaseModal";
import SaveButton from "../../components/Button/SaveButton";
import CancelButton from "../../components/Button/CancelButton";
import DropDownButton from "@/components/Button/DropDownButton";
import exitIcon from "@/assets/icons/exiticon.svg";
import addImageIcon from "@/assets/icons/add_image.svg";
import starFilledIcon from "@/assets/icons/starfilled.svg";
import starUnfilledIcon from "@/assets/icons/starunfilled.svg";
import publicIcon from "@/assets/icons/publicicon.svg";
import privateIcon from "@/assets/icons/privateicon.svg";
import purplePrivateIcon from "@/assets/icons/purpleprivateicon.svg";
import type { SummaryTypeParam } from "@/models/post.model";

import { uploadImage } from "@/api/image.api";

type Visibility = "public" | "private";

export type PostSavePayload = {
  importance: number;
  thumbnail: string | null;
  description: string;
  visibility: Visibility;
  projectId: number | null;
  projectName?: string;
  summaryType?: SummaryTypeParam;
};

type ProjectOption = { id: number; name: string };

export default function PostSaveModal({
  onClose,
  onNext,
  projects = [],
  defaultProjectId,
  loadingProjects = false,
  selectedTags = [],
  initialImportance,
  initialDescription,
  initialVisibility,
  initialProjectId,
  initialThumbnail,
  selectedErrorType,
}: {
  onClose: () => void;
  onNext: (payload: PostSavePayload) => void;
  projects?: ProjectOption[];
  defaultProjectId?: number;
  loadingProjects?: boolean;
  selectedTags?: string[];
  selectedErrorType: string | null;
  initialImportance?: number;
  initialDescription?: string;
  initialVisibility?: Visibility;
  initialProjectId?: number | null;
  initialThumbnail?: string | null;
}) {
  const [thumbnail, setThumbnail] = useState<string | null>(
    initialThumbnail ?? null
  ); // 서버 URL
  const [importance, setImportance] = useState<number>(initialImportance ?? 0);
  const [description, setDescription] = useState<string>(
    initialDescription ?? ""
  );
  const [selectedVisibility, setSelectedVisibility] = useState<Visibility>(
    initialVisibility ?? "public"
  );
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    initialProjectId ?? defaultProjectId ?? null
  );
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  // 업로드 상태
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tempPreview, setTempPreview] = useState<string | null>(null); // 로컬 미리보기

  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_MB = 8;

  const projectName =
    projects.find((p) => p.id === selectedProjectId)?.name ?? "";
  const projectNames = projects.map((p) => p.name);
  const nameToId = new Map(projects.map((p) => [p.name, p.id]));

  useEffect(() => {
    if (initialImportance != null) setImportance(initialImportance);
  }, [initialImportance]);

  useEffect(() => {
    if (initialDescription != null) setDescription(initialDescription);
  }, [initialDescription]);

  useEffect(() => {
    if (initialVisibility) setSelectedVisibility(initialVisibility);
  }, [initialVisibility]);

  useEffect(() => {
    const pid = initialProjectId ?? defaultProjectId ?? null;
    setSelectedProjectId(pid);
  }, [initialProjectId, defaultProjectId]);

  useEffect(() => {
    if (initialThumbnail !== undefined) setThumbnail(initialThumbnail);
  }, [initialThumbnail]);

  useEffect(() => {
    return () => {
      if (tempPreview) URL.revokeObjectURL(tempPreview);
    };
  }, [tempPreview]);

  const previewTags: string[] = useMemo(
    () => (selectedTags ?? []).slice(0, 3),
    [selectedTags]
  );
  const extraCount = Math.max(0, (selectedTags?.length ?? 0) - 3);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 기본 검증
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어요.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`파일 용량이 너무 커요. 최대 ${MAX_MB}MB까지 가능합니다.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 로컬 프리뷰
    if (tempPreview) URL.revokeObjectURL(tempPreview);
    const localUrl = URL.createObjectURL(file);
    setTempPreview(localUrl);

    // 서버 업로드
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const serverUrl = await uploadImage(file, (p) => setUploadProgress(p));

      setThumbnail(serverUrl);
      if (localUrl) URL.revokeObjectURL(localUrl);
      setTempPreview(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "이미지 업로드에 실패했습니다.");
      setThumbnail(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    if (tempPreview) {
      URL.revokeObjectURL(tempPreview);
      setTempPreview(null);
    }
    setThumbnail(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleNextClick = () => {
    setHasTriedSubmit(true);
    if (isUploading) {
      alert("이미지 업로드가 끝난 후 저장할 수 있어요.");
      return;
    }
    if (importance === 0) {
      alert("중요도를 선택해주세요.");
      return;
    }
    if (selectedProjectId == null) {
      alert("프로젝트를 선택해주세요.");
      return;
    }
    if (!description.trim()) {
      return;
    }

    onNext({
      importance,
      thumbnail,
      description,
      visibility: selectedVisibility,
      projectId: selectedProjectId,
      projectName,
    });
  };

  return (
    <BaseModal
      onClose={onClose}
      width="w-[800px]"
      className="bg-white rounded-[12px] px-[36px]"
    >
      {/* 헤더 */}
      <div className="flex w-full justify-between gap-[500px] mt-[36px] mb-[24px]">
        <span className="text-head-24-bold">포스트 미리 보기</span>
        <button onClick={onClose} className="w-6 h-6">
          <img src={exitIcon} alt="닫기" className="w-full h-full" />
        </button>
      </div>

      <div className="flex flex-col gap-[10px]">
        <div className="items-center gap-[40px]">
          {/* 썸네일 + 별점 */}
          <div className="inline-flex items-center pt-[33px] pr-[65px] gap-[108px]">
            {/* 썸네일 */}
            <div className="relative flex w-[351px] h-[154px] overflow-hidden justify-center items-center border-dashed border-[2px] border-gray1 bg-[#FCFCFC] rounded-[16px]">
              {tempPreview || thumbnail ? (
                <img
                  src={tempPreview ?? thumbnail!}
                  alt="썸네일"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="flex w-[111px] flex-col items-center gap-[23px]">
                  <img src={addImageIcon} className="w-[52px] h-[52px]" />
                  <button
                    onClick={handleUploadClick}
                    className="flex w-[111px] h-[38px] self-stretch justify-center items-center bg-white border-[1.5px] border-gray1 rounded-[8px]"
                  >
                    <span className="text-sm font-normal text-black">
                      썸네일 업로드
                    </span>
                  </button>
                </div>
              )}

              {/* 진행률 오버레이 */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                  <div className="w-[70%] h-2 bg-white/40 rounded">
                    <div
                      className="h-2 bg-white rounded"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-white text-sm">{uploadProgress}%</span>
                </div>
              )}

              {/* 삭제 버튼 */}
              {!isUploading && (thumbnail || tempPreview) && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute bottom-[18px] z-10 px-[23px] pt-[10px] pb-[11px] bg-white border-[1.5px] border-gray1 rounded-[8px]"
                >
                  썸네일 삭제
                </button>
              )}

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* 별점 */}
            <div className="flex flex-col w-[208px] gap-[28px]">
              <span
                className={`text-xl font-semibold transition ${
                  hasTriedSubmit && importance === 0
                    ? "text-purple-500"
                    : "text-black"
                }`}
              >
                중요도를 표시해주세요!
              </span>
              <div className="flex gap-[4px]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setImportance(i)}
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                  >
                    <img
                      src={i <= importance ? starFilledIcon : starUnfilledIcon}
                      className="w-[32px] h-[32px]"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 아래 영역 */}
          <div className="flex flex-col items-center gap-[16px] w-[728px] pt-[40px] ">
            {/* (에러타입+tag) + 소개 */}
            <div className="flex flex-row gap-[26px]">
              {/* 에러 + 태그 (프리뷰용) */}
              <div className="flex flex-col items-start gap-[16px]">
                <div className="flex flex-col w-[351px] justify-center items-start h-[78px] gap-[8px] pr-[26px] shrink-0">
                  <span className="text-head-20-semibold text-black ">
                    에러타입
                  </span>
                  <div className="grid w/[345px] w-[345px] h-[46px] px-[15px] py-[14px] border rounded border-purple-300 bg-white ">
                    <span className="flex flex-1 self-stretch font-normal text-sm text-purple-700">
                      {selectedErrorType}
                    </span>
                  </div>
                </div>
                {/* 태그 */}
                <div className="flex w-[351px] flex-col pt-[26px] ">
                  <span className="text-head-20-semibold text-black">
                    카테고리 태그
                  </span>
                  <div className="grid gap-[8px] h-[46px] shrink-0">
                    <div className="flex items-center gap-[12px] self-stretch shrink-0">
                      {previewTags.length > 0 ? (
                        <>
                          {previewTags.map((tag, i) => (
                            <div
                              key={`${tag}-${i}`}
                              className="flex h-[32px] py-[7px] px-[10px] justify-center items-center gap-[2px] bg-purple-100 text-purple-700 rounded-full text-sm"
                            >
                              #{tag}
                            </div>
                          ))}
                          {extraCount > 0 && (
                            <div className="flex h-[32px] py-[7px] px-[10px] justify-center items-center gap-[2px] bg-gray-100 text-gray-600 rounded-full text-sm">
                              +{extraCount}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">
                          선택된 태그가 없어요.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* 소개 */}
              <div className="flex flex-col w-[351px] gap-[8px]">
                <span className="text-head-20-semibold text-black">
                  포스트 소개
                </span>
                <div
                  className={`transition-all ${
                    hasTriedSubmit && !description.trim()
                      ? "border border-purple-500 rounded-[8px] p-[10px]"
                      : ""
                  }`}
                >
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                    placeholder="포스트를 짧게 소개해주세요."
                    className="w-[335px] h-[119px] resize-none pl-[14px] py-[8px] border border-gray1 rounded-[8px] text-body-14-regular"
                  />
                  <div className="text-right text-caption-12-regular text-gray2 mt-[4px]">
                    {description.length}/200
                  </div>
                </div>
                {hasTriedSubmit && !description.trim() && (
                  <span className="text-sm text-purple-500 pl-[4px] pt-[2px]">
                    소개글을 입력해주세요.
                  </span>
                )}
              </div>
            </div>

            {/* 공개 설정 + 프로젝트 */}
            <div className="flex w-[728px] flex-row gap-[26px] ">
              <div className="flex flex-col w-[351px] gap-[8px]">
                <span className="text-head-20-semibold text-gray7">
                  공개 설정
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className={`flex w-[168px] h-[46px] items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${
                      selectedVisibility === "public"
                        ? "border-purple-500 text-purple-500 bg-opacity-10"
                        : "border-gray2"
                    }`}
                    onClick={() => setSelectedVisibility("public")}
                  >
                    <img
                      src={publicIcon}
                      className={`w-5 h-5 transition ${
                        selectedVisibility === "public" ? "" : "grayscale"
                      }`}
                      alt="공개 아이콘"
                    />
                    <span
                      className={
                        selectedVisibility === "public"
                          ? "text-purple"
                          : "text-gray2"
                      }
                    >
                      전체 공개
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`flex w-[168px] h-[46px] items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${
                      selectedVisibility === "private"
                        ? "border-purple-500 text-purple-500 bg-opacity-10"
                        : "border-gray2"
                    }`}
                    onClick={() => setSelectedVisibility("private")}
                  >
                    <img
                      src={
                        selectedVisibility === "private"
                          ? purplePrivateIcon
                          : privateIcon
                      }
                      className="w-5 h-5 transition"
                      alt="비공개 아이콘"
                    />
                    <span
                      className={
                        selectedVisibility === "private"
                          ? "text-purple"
                          : "text-gray2"
                      }
                    >
                      비공개
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col w-[351px] gap-[8px]">
                <span className="text-head-20-semibold text-black">
                  프로젝트
                </span>
                <div
                  className={`transition-all ${
                    !selectedProjectId && hasTriedSubmit
                      ? "border border-purple-500 rounded-[8px] p-[4px]"
                      : ""
                  }`}
                >
                  <DropDownButton
                    options={projectNames}
                    placeholder={
                      loadingProjects
                        ? "프로젝트 불러오는 중..."
                        : projectName || "프로젝트를 선택해주세요."
                    }
                    width="w-full"
                    onSelect={(selectedName) =>
                      setSelectedProjectId(nameToId.get(selectedName) ?? null)
                    }
                  />
                </div>
                {!selectedProjectId && hasTriedSubmit && (
                  <span className="text-sm text-purple-500 pl-[4px] pt-[2px]">
                    프로젝트를 선택해주세요.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-[16px] pt-[12px] pb-[32px]">
          <CancelButton onClick={onClose} />
          <SaveButton onClick={handleNextClick} disabled={isUploading} />
        </div>
      </div>
    </BaseModal>
  );
}
