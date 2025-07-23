import { useState, useRef } from "react";
import BaseModal from "./BaseModal";
import SaveButton from "../Button/SaveButton";
import CancelButton from "../Button/CancelButton";
import exitIcon from "../../assets/images/exiticon.svg";

export default function PostSaveModal({ onClose }: { onClose: () => void }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [importance, setImportance] = useState(0);
  const [description, setDescription] = useState("");
  const [selectedVisibility, setSelectedVisibility] = useState("public");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hoverIndex, setHoverIndex] = useState(0); // 마우스 올린 상태

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

  return (
    <BaseModal
      onClose={onClose}
      width="w-[800px]"
      className="bg-white rounded-[12px]"
    >
      {/* 헤더 */}
      <div className="flex w-[728px] justify-between gap-[500px] mt-[36px] mb-[24px]">
        <span className="text-head-24-bold">포스트 미리 보기</span>
        <button onClick={onClose} className="w-6 h-6">
          <img src={exitIcon} alt="닫기" className="w-full h-full" />
        </button>
      </div>
      <div className="flex flex-col gap-[10px]">
        <div className="items-center gap-[40px]">
          {/* 썸네일 + 별점 */}
          <div className="inline-flex items-center pt-[33px] pl-[36px] pr-[97px] gap-[108px]">
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
                    <img
                      src="/icons/add_image.svg"
                      className="w-[52px] h-[52px]"
                    />
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
            <div className="flex flex-col gap-[28px]">
              <span className="text-xl font-semibold text-black">
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
                          ? "/src/assets/images/starfilled.svg"
                          : "/src/assets/images/starunfilled.svg"
                      }
                      className="w-[32px] h-[32px]"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/*썸네일 아래 모든 컴포넌트(버튼 제외)*/}
          <div className="flex-col items-center gap-[16px] w-[728px] pt-[40px] px-[36px]">
            {/* (에러타입+tag) + 소개 */}
            <div className="flex flex-row gap-[26px]">
              {/*에러 +태그 */}
              <div className="flex-col items-start gap-[16px]">
                <div className="flex flex-col w-[351px] justify-center items-start h-[78px] gap-[8px] pr-[26px] shrink-0">
                  <span className="text-head-20-semibold text-black ">
                    에러타입
                  </span>
                  <div className="grid w-[351px] h-[46px] px-[15px] py-[14px] border rounded border-purple-300 bg-white ">
                    <span className="flex flex-1 self-stretch font-normal text-sm text-purple-700">
                      Build / Compile
                    </span>
                  </div>
                </div>
                {/* 태그 */}
                <div className="flex w-[351px]  flex-col pt-[16px] ">
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
                    className="w-[351px]  h-[119px] resize-none px-[12px] py-[8px] border border-gray2 rounded-[8px] text-body-14-regular"
                  />
                  <div className="text-right text-caption-12-regular text-gray4 mt-[4px]">
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
                <div className="flex gap-[12px]">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="public"
                      checked={selectedVisibility === "public"}
                      onChange={(e) => setSelectedVisibility(e.target.value)}
                    />
                    전체 공개
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="private"
                      checked={selectedVisibility === "private"}
                      onChange={(e) => setSelectedVisibility(e.target.value)}
                    />
                    비공개
                  </label>
                </div>
              </div>

              <div className="flex flex-col w-[351px] gap-[8px]">
                <span className="text-head-20-semibold text-black">
                  폴더 경로
                </span>
                <select className="mt-[8px] px-[12px] py-[8px] border border-gray2 rounded-[8px] w-full">
                  <option>폴더를 선택해주세요.</option>
                  <option>AI카츠</option>
                  <option>Spring Boot</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end px-[36px] gap-[12px] pt-[12px] pb-[32px]">
          <CancelButton onClick={onClose} />
          <SaveButton onClick={() => alert("제출")} label="다음" />
        </div>
      </div>
    </BaseModal>
  );
}
