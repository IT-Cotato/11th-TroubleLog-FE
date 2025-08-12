import { useState, useRef, useEffect } from "react";
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

type Visibility = "public" | "private";

export type PostSavePayload = {
  importance: number;
  thumbnail: string | null;
  description: string;
  visibility: Visibility;
  projectId: number;
  projectName?: string;
};

type ProjectOption = { id: number; name: string };

export default function PostSaveModal({
  onClose,
  onNext,
  projects = [],
  defaultProjectId,
  loadingProjects = false,
}: {
  onClose: () => void;
  onNext: (payload: PostSavePayload) => void;
  projects?: ProjectOption[];
  defaultProjectId?: number;
  loadingProjects?: boolean;
}) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [importance, setImportance] = useState(0);
  const [description, setDescription] = useState("");
  const [selectedVisibility, setSelectedVisibility] =
    useState<Visibility>("public");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hoverIndex, setHoverIndex] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    defaultProjectId ?? null
  );
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const projectName =
    projects.find((p) => p.id === selectedProjectId)?.name ?? "";

  const projectNames = projects.map((p) => p.name);
  const nameToId = new Map(projects.map((p) => [p.name, p.id]));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (thumbnail && thumbnail.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnail);
      }
      setThumbnail(URL.createObjectURL(file));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleNextClick = () => {
    setHasTriedSubmit(true);

    if (importance === 0) return; //홈화면 프로젝트생성 연동후 !selectedProjectId || 추가

    onNext({
      importance,
      thumbnail,
      description,
      visibility: selectedVisibility,
      projectId: selectedProjectId,
      projectName,
    });
  };
  useEffect(() => {
    if (defaultProjectId != null) setSelectedProjectId(defaultProjectId);
  }, [defaultProjectId]);
  useEffect(() => {
    return () => {
      if (thumbnail && thumbnail.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnail);
      }
    };
  }, [thumbnail]);

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
            <div className=" relative flex w-[351px] h-[154px] overflow-hidden justify-center items-center border-dashed border-[2px] border-gray1 bg-[#FCFCFC] rounded-[16px]">
              {thumbnail ? (
                <>
                  <img
                    src={thumbnail}
                    alt="썸네일"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setThumbnail(null)}
                    className="absolute bottom-[18px] z-10 px-[23px] pt-[10px] pb-[11px] bg-white border-[1.5px] border-gray1 rounded-[8px]"
                  >
                    썸네일 삭제
                  </button>
                </>
              ) : (
                <>
                  <div className="flex w-[111px] flex-col items-center gap-[23px]">
                    <img src={addImageIcon} className="w-[52px] h-[52px]" />
                    <button
                      onClick={handleUploadClick}
                      className=" flex w-[111px] h-[38px] self-stretch justify-center items-center bg-white border-[1.5px] border-gray1 rounded-[8px]"
                    >
                      <span className="text-sm font-normal text-black">
                        썸네일 업로드
                      </span>
                    </button>
                  </div>
                </>
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
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(0)}
                  >
                    <img
                      src={
                        i <= (hoverIndex || importance)
                          ? starFilledIcon
                          : starUnfilledIcon
                      }
                      className="w-[32px] h-[32px]"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/*썸네일 아래 모든 컴포넌트(버튼 제외)*/}
          <div className="flex-col items-center gap-[16px] w-[728px] pt-[40px] ">
            {/* (에러타입+tag) + 소개 */}
            <div className="flex flex-row gap-[26px]">
              {/*에러 +태그 */}
              <div className="flex-col items-start gap-[16px]">
                <div className="flex flex-col w-[351px] justify-center items-start h-[78px] gap-[8px] pr-[26px] shrink-0">
                  <span className="text-head-20-semibold text-black ">
                    에러타입
                  </span>
                  <div className="grid w-[345px] h-[46px] px-[15px] py-[14px] border rounded border-purple-300 bg-white ">
                    <span className="flex flex-1 self-stretch font-normal text-sm text-purple-700">
                      Build / Compile
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
                      {["#Spring Boot", "#Spring Boot", "#Spring Boot"].map(
                        (tag, i) => (
                          <div
                            key={i}
                            className=" flex w-[102px] h-[32px] py-[7px] px-[10px] justify-center items-center gap-[2px] bg-purple-100 text-purple-700 rounded-full text-sm"
                          >
                            {tag}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col w-[351px] gap-[8px]">
                <span className="text-head-20-semibold text-black">
                  포스트 소개
                </span>
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                    placeholder="포스트를 짧게 소개해주세요."
                    className="w-[351px]  h-[119px] resize-none px-[12px] py-[8px] border border-gray1 rounded-[8px] text-body-14-regular"
                  />
                  <div className="text-right text-caption-12-regular text-gray2 mt-[4px]">
                    {description.length}/200
                  </div>
                </div>
              </div>
            </div>

            {/* 공개 설정 + 폴더 경로 */}
            <div className="flex w-[728px] flex-row gap-[26px] ">
              <div className="flex flex-col w-[351px] gap-[8px]">
                <span className="text-head-20-semibold text-gray7">
                  공개 설정
                </span>
                <div className="flex gap-3">
                  {/* 전체 공개 */}
                  <button
                    type="button"
                    className={`flex w-[168px] h-[46px] items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition
      ${
        selectedVisibility === "public"
          ? "border-purple-500  text-purple-500 bg-opacity-10"
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

                  {/* 비공개 */}
                  <button
                    type="button"
                    className={`flex w-[168px] h-[46px] items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition
    ${
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
                        : "프로젝트를 선택해주세요."
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
          <SaveButton onClick={handleNextClick} />
        </div>
      </div>
    </BaseModal>
  );
}
