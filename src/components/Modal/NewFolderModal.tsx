import { useRef, useState } from "react";
import useClickOutside from "@/hooks/useClickOutside";

interface NewFolderModalProps {
  onClose: () => void;
}

export default function NewFolderModal({ onClose }: NewFolderModalProps) {
  const modalRef = useClickOutside(onClose);

  // 썸네일 상태
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setThumbnail(imageUrl);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      {/* 배경 블러 */}
      <div className="absolute inset-0 backdrop-blur-sm" />

      {/* 모달 본문 */}
      <div
        ref={modalRef}
        className="relative z-10 w-[703px] rounded-[20px] bg-white shadow-card"
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center px-[36px] mb-[24px] mt-[36px]">
          <span className="text-head-24-bold">새 폴더</span>
          <button onClick={onClose}>
            <img
              src="/icons/close.svg"
              alt="close"
              className="w-[24px] h-[24px] mb-[12px] mt-[3px]"
            />
          </button>
        </div>

        {/* 구분선 */}
        <div className="w-full h-[1px] bg-gray1 mb-[32px]" />

        {/* 본문 */}
        <div className="flex justify-between items-center mb-[32px] px-[36px]">
          {/* 썸네일 업로드 */}
          <div className="relative flex w-[186px] h-[186px] overflow-hidden flex-col justify-center items-center gap-[23px] rounded-[16px] border-dashed border-[2px] border-gray1 bg-[#FCFCFC]">
            {/* 썸네일 미리보기 */}
            {thumbnail ? (
              <>
                <img
                  src={thumbnail}
                  alt="thumbnail"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* 썸네일 삭제 버튼 */}
                <button
                  onClick={() => setThumbnail(null)}
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

                {/* 썸네일 업로드 버튼 */}
                <button
                  onClick={handleUploadClick}
                  className="flex px-[17px] pt-[10px] pb-[11px] justify-center items-center rounded-[8px] border-[1.5px] border-gray1 bg-white"
                >
                  <span className="text-body-14-regular">썸네일 업로드</span>
                </button>
              </>
            )}

            {/* 실제 파일 input (숨김) */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
          {/* 입력 영역 */}
          <div className="flex flex-col gap-[30px]">
            {/* 폴더 이름 */}
            <div className="flex flex-col justify-center items-start gap-[8px]">
              <span className="text-head-20-semibold">폴더 이름</span>
              <input
                className="flex pl-[15px] pt-[15px] pr-[230px] pb-[14px] items-center rounded-[8px] border border-gray1 bg-white text-body-14-regular"
                placeholder="폴어 이름을 입력해주세요."
              />
            </div>
            {/* 한 줄 소개 */}
            <div className="flex flex-col justify-center items-start gap-[8px]">
              <span className="text-head-20-semibold">한 줄 소개</span>
              <input
                className="flex pl-[15px] pt-[15px] pr-[230px] pb-[14px] items-center rounded-[8px] border border-gray1 bg-white text-body-14-regular"
                placeholder="한 줄 소개를 입력해주세요."
              />
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-[17px] mb-[24px] px-[36px]">
          {/* 취소 */}
          <button
            onClick={onClose}
            className="flex py-[16px] px-[57px] justify-center items-center rounded-[12px] border border-gray1 bg-white"
          >
            <span className="text-primaryColor text-head-20-semibold">
              취소
            </span>
          </button>
          {/* 생성 */}
          <button className="flex py-[16px] px-[57px] justify-center items-center rounded-[12px] border border-gray1 bg-primary">
            <span className="text-white text-head-20-semibold">생성</span>
          </button>
        </div>
      </div>
    </div>
  );
}
