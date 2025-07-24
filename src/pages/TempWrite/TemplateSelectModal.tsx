import { useState } from "react";
import BaseModal from "../../components/Modal/BaseModal";
import CancelButton from "../../components/Button/CancelButton";
import exitIcon from "../../assets/images/exiticon.svg";
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
  return (
    <BaseModal
      onClose={onClose}
      width="w-[1334px]"
      className="bg-white rounded-[12px] px-[36px]"
    >
      {/* 헤더 */}
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
          <SaveButton onClick={onConfirm} label="요약" />
        </div>
      </div>
    </BaseModal>
  );
}
