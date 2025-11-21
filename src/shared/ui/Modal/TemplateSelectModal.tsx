import { useState } from "react";
import BaseModal from "@/shared/ui/Modal/BaseModal";
import CancelButton from "@/shared/ui/Button/CancelButton";
import SaveButton from "@/shared/ui/Button/SaveButton";
import exitIcon from "@/assets/icons/exiticon.svg";
import type { SummaryTypeParam } from "@/models/post.model";

const templates = ["자기소개서", "면접 대비", "회고록", "Issue 관리"];
const TEMPLATE_TO_TYPE: Record<number, SummaryTypeParam> = {
  0: "RESUME",
  1: "INTERVIEW",
  2: "MEMOIRS",
  3: "ISSUE_MANAGEMENT",
};

export default function TemplateSelectModal({
  onClose,
  onConfirm,
  onLater,
  onPrev,
}: {
  onClose: () => void;
  onConfirm: (type: SummaryTypeParam, label: string) => void;
  onLater: () => void;
  onPrev?: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const handleConfirm = () => {
    setHasTriedSubmit(true);
    if (selectedIndex === null) return;
    onConfirm(TEMPLATE_TO_TYPE[selectedIndex], templates[selectedIndex]);
  };

  return (
    <BaseModal
      onClose={onClose}
      /* 데스크톱은 기존 최대폭 유지, 작은 화면은 화면 너비에 맞춤 */
      width="w-full max-w-[1334px]"
      className="bg-white rounded-[12px] px-4 sm:px-6 md:px-8"
    >
      {/* 안내 토스트 (작은 화면에선 상단 여백 조정) */}
      {hasTriedSubmit && selectedIndex === null && (
        <div className="fixed top-20 sm:top-[100px] left-1/2 -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded shadow">
          템플릿을 선택해주세요.
        </div>
      )}

      {/* 헤더: 좌 타이틀 / 우 닫기 버튼 */}
      <div className="flex w-full items-center justify-between mt-6 mb-4 sm:mt-8 sm:mb-6">
        <span className="text-head-32-bold">어떤 방식으로 요약할까요?</span>
        <button onClick={onClose} className="w-6 h-6">
          <img src={exitIcon} alt="닫기" className="w-full h-full" />
        </button>
      </div>

      {/* 본문 */}
      <div className="flex flex-col pt-8 sm:pt-10 md:pt-12 gap-[28px]">
        {/* 템플릿 그리드: 모바일 2열 → md 이상 4열 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[20px] place-items-center">
          {templates.map((label, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-[20px] w-full max-w-[282px]"
            >
              <span
                className={`text-head-20-semibold ${
                  selectedIndex === index ? "text-purple-500" : "text-black"
                }`}
              >
                {label}
              </span>

              <button
                onClick={() => setSelectedIndex(index)}
                className={`w-full sm:w-[240px] md:w-[282px] h-[160px] sm:h-[190px] md:h-[218px]
                  flex items-center justify-center overflow-hidden
                  rounded-[12px] border-[3px] shadow-[1px_1px_6px_0px_rgba(0,0,0,0.2)]
                  ${
                    selectedIndex === index
                      ? "border-dashed border-purple-500"
                      : "border-transparent"
                  }
                `}
              >
                <img
                  src={
                    selectedIndex === index
                      ? `/icons/tempimg${index + 1}purple.svg`
                      : `/icons/tempimg${index + 1}gray.svg`
                  }
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-[82px] md:h-[82px] object-contain"
                  alt={label}
                />
              </button>
            </div>
          ))}
        </div>

        {/* 버튼 영역: 모바일에선 세로 스택, md 이상 가로 정렬 */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-0 pt-3 pb-6">
          <div className="order-2 md:order-1">
            {onPrev && <CancelButton onClick={onPrev} label="이전" />}
          </div>
          <div className="order-1 md:order-2 flex justify-end gap-[16px]">
            <CancelButton onClick={onLater} label="다음에" />
            <SaveButton onClick={handleConfirm} label="요약" />
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
