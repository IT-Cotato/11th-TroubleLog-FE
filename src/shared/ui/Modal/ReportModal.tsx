import { useState } from "react";
import BaseModal from "./BaseModal";
import exitIcon from "@/assets/icons/exiticon.svg";
import unselectedCircle from "@/assets/icons/unselected_circle.svg";
import selectedCircle from "@/assets/icons/selected_circle.svg";

export const REPORT_REASONS = [
  "스팸 및 홍보성 게시글",
  "기술적 오류 및 잘못된 정보",
  "저작권 침해 및 무단 전재",
  "비방, 욕설 및 혐오 표현",
  "주제와 맞지 않는 게시글",
  "개인정보노출",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

interface ReportModalProps {
  onClose: () => void;
  onSubmit?: (reason: ReportReason) => void;
  /** 권리침해 신고 페이지 URL (미제공 시 링크 비활성화) */
  rightsViolationReportUrl?: string;
  loading?: boolean;
}

export default function ReportModal({
  onClose,
  onSubmit,
  rightsViolationReportUrl,
  loading = false,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason>(
    REPORT_REASONS[0],
  );

  const handleSubmit = () => {
    if (!selectedReason) return;
    onSubmit?.(selectedReason);
  };

  return (
    <BaseModal
      onClose={onClose}
      width="w-[min(540px,92vw)]"
      className="bg-white shadow-card pt-5 sm:pt-6 pb-8 sm:pb-10 items-stretch"
    >
      {/* 헤더 */}
      <div className="w-full mb-6 border-b border-gray1 pb-5">
        <div className="flex justify-between items-center px-6 sm:px-10">
          <h2 className="text-head-24-bold text-black">신고하기</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-6 h-6 flex items-center justify-center"
          >
            <img src={exitIcon} alt="" className="w-full h-full" />
          </button>
        </div>
      </div>

      {/* 신고 사유 라디오 그룹 (2열) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 sm:gap-x-6 gap-y-7 sm:gap-y-9 w-full mt-5 mb-5 px-8 sm:px-12">
        {REPORT_REASONS.map((reason) => {
          const isSelected = selectedReason === reason;
          return (
            <label
              key={reason}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span className="relative shrink-0 w-6 h-6 flex items-center justify-center">
                <input
                  type="radio"
                  name="reportReason"
                  value={reason}
                  checked={isSelected}
                  onChange={() => setSelectedReason(reason)}
                  className="sr-only"
                />
                <img
                  src={isSelected ? selectedCircle : unselectedCircle}
                  alt=""
                  aria-hidden
                  className="w-6 h-6 block"
                />
              </span>
              <span className="text-body-14-regular sm:text-body-16-regular text-black group-hover:text-gray4">
                {reason}
              </span>
            </label>
          );
        })}
      </div>

      {/* 안내 텍스트 */}
      <p className="text-body-16-regular text-[#525252] mt-6 mb-2 leading-relaxed px-8 sm:px-12 whitespace-pre-line text-left">
        {`저작권 위반 및 명예훼손 등의 권리침해 신고는 신고센터로 추가 서류를
접수해 주세요. 
추가 서류가 접수되지 않을 경우, 신고 건이 처리되지 않습니다.`}
      </p>

      {/* 권리침해 신고하기 링크 (URL 제공 시에만 렌더링) */}
      {rightsViolationReportUrl &&
      rightsViolationReportUrl !== "#" &&
      rightsViolationReportUrl.trim() !== "" ? (
        <a
          href={rightsViolationReportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-16-regular text-[#525252] hover:opacity-90 mt-3 mb-8 inline-flex items-center gap-0.5 px-8 sm:px-12"
        >
          <span className="underline">권리침해 신고하기</span>
          &gt;
        </a>
      ) : (
        <span className="text-body-16-regular text-gray2 mt-3 mb-8 inline-flex items-center gap-0.5 px-8 sm:px-12 cursor-default">
          권리침해 신고하기 &gt;
        </span>
      )}

      {/* 신고하기 버튼 */}
      <div className="flex justify-center w-full">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedReason || loading}
          className="w-full max-w-[200px] sm:max-w-[160px] py-3 sm:py-[16px] min-h-[44px] sm:min-h-0 rounded-xl bg-primary text-white text-head-16-semibold sm:text-head-18-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
        >
          {loading ? "처리 중..." : "신고하기"}
        </button>
      </div>
    </BaseModal>
  );
}
