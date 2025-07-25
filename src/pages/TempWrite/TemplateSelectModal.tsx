import { useState } from "react";
import BaseModal from "../../components/Modal/BaseModal";
import CancelButton from "../../components/Button/CancelButton";
import exitIcon from "../../../public/icons/exiticon.svg";
import SaveButton from "@/components/Button/SaveButton";
const templates = ["자기소개서", "면접 대비", "블로그", "Issue 관리"];

export default function TemplateSelectModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const handleConfirm = () => {
    setHasTriedSubmit(true);

    if (selectedIndex === null) return;

    onConfirm();
  };

  return (
    <BaseModal
      onClose={onClose}
      width="w-[1334px]"
      className="bg-white rounded-[12px] px-[36px]"
    >
      {/* 헤더 */}
      {hasTriedSubmit && selectedIndex === null && (
        <div className="fixed top-[100px] left-1/2 transform -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded shadow">
          템플릿을 선택해주세요.
        </div>
      )}

      <div className="flex w-full mt-[36px] mb-[24px] pl-[500px]">
        <div className="flex w-[763px] justify-between items-center">
          <span className="text-head-32-bold ">어떤 방식으로 요약할까요?</span>
          <button onClick={onClose} className="w-6 h-6">
            <img src={exitIcon} alt="닫기" className="w-full h-full" />
          </button>
        </div>
      </div>
      {/*헤더아래*/}
      <div className="flex flex-col pt-[48px] px-[78px] gap-[28px]">
        {/*템플릿 아이콘*/}
        <div className="flex gap-[20px]">
          {templates.map((label, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-[20px] w-[282px]"
            >
              <span
                className={`text-head-20-semibold ${
                  selectedIndex === index ? "text-purple-500" : "text-black"
                }`}
              >
                {label}
              </span>

              <button
                className={`w-[282px] h-[218px] overflow-hidden rounded-[12px] border-2 ${
                  selectedIndex === index
                    ? "border-dashed border-purple-400"
                    : "border-transparent"
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <img
                  src="/src/assets/images/mockimg.jpg"
                  className="w-full h-full object-cover"
                  alt={label}
                />
              </button>
            </div>
          ))}
        </div>
        {/* 버튼 */}
        <div className="flex justify-end gap-[16px] pt-[12px] pb-[32px]">
          <CancelButton onClick={onClose} label="다음에" />
          <SaveButton onClick={handleConfirm} label="요약" />
        </div>
      </div>
    </BaseModal>
  );
}
