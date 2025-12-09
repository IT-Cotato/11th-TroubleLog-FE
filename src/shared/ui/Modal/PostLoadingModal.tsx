import BaseModal from "./BaseModal";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import PostSuccessModal from "@/shared/ui/Modal/PostSuccessModal";
import { useEffect, useMemo, useState } from "react";
import exitIcon from "@/assets/icons/exiticon.svg";

export type SummaryStatus =
  | "PENDING"
  | "STARTED"
  | "PREPROCESSING"
  | "ANALYZING"
  | "POSTPROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

const STATUS_UI: Record<
  SummaryStatus,
  { label: string; desc: string; color: string; trail: string }
> = {
  PENDING: {
    label: "대기 중이에요",
    desc: "잠시만 기다려 주세요.",
    color: "#9CA3AF",
    trail: "#EEE",
  },
  STARTED: {
    label: "분석을 시작했어요",
    desc: "트러블슈팅 문서 분석을 시작했어요.",
    color: "#22C55E",
    trail: "#E8F8EF",
  },
  PREPROCESSING: {
    label: "자료를 준비하고 있어요",
    desc: "문서를 정리하고 필요한 정보를 모으는 중이에요.",
    color: "#F59E0B",
    trail: "#FFF7E8",
  },
  ANALYZING: {
    label: "AI가 내용을 파악하는 중이에요",
    desc: "핵심과 원인을 분석하고 있어요.",
    color: "#7C3AED",
    trail: "#F1E9FE",
  },
  POSTPROCESSING: {
    label: "결과를 보기 좋게 다듬는 중이에요",
    desc: "요약을 읽기 쉽게 정리하고 있어요.",
    color: "#0EA5E9",
    trail: "#E7F5FD",
  },
  COMPLETED: {
    label: "완료됐어요",
    desc: "요약이 준비됐습니다.",
    color: "#16A34A",
    trail: "#E8F5EE",
  },
  FAILED: {
    label: "요약에 실패했어요",
    desc: "잠시 후 다시 시도하거나, 네트워크 상태를 확인해주세요.",
    color: "#EF4444",
    trail: "#FEE2E2",
  },
  CANCELLED: {
    label: "요약을 취소했어요",
    desc: "요약본 생성이 취소되었어요",
    color: "#EF4444",
    trail: "#FEE2E2",
  },
};

export const statusToPercent = (s: SummaryStatus) =>
  ({
    PENDING: 0,
    STARTED: 10,
    PREPROCESSING: 25,
    ANALYZING: 50,
    POSTPROCESSING: 80,
    COMPLETED: 100,
    FAILED: 0,
    CANCELLED: 0,
  }[s]);

function fallbackByProgress(p: number) {
  if (p >= 100) return STATUS_UI.COMPLETED;
  if (p >= 80) return STATUS_UI.POSTPROCESSING;
  if (p >= 50) return STATUS_UI.ANALYZING;
  if (p >= 25) return STATUS_UI.PREPROCESSING;
  if (p >= 10) return STATUS_UI.STARTED;
  return STATUS_UI.PENDING;
}

export default function PostLoadingModal({
  onClose,
  progress,
  templateLabel,
  status,
  serverMessage,
}: {
  onClose: () => void;
  progress: number;
  templateLabel: string;
  status?: SummaryStatus | null;
  serverMessage?: string;
}) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));

  const ui = useMemo(() => {
    if (status && STATUS_UI[status]) return STATUS_UI[status];
    return fallbackByProgress(safeProgress);
  }, [status, safeProgress]);

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (status === "COMPLETED" || safeProgress >= 100) {
      const t = setTimeout(() => setShowSuccess(true), 300);
      return () => clearTimeout(t);
    }
  }, [status, safeProgress]);

  if (showSuccess) return <PostSuccessModal onClose={onClose} />;

  return (
    <BaseModal
      onClose={onClose}
      width="w-full max-w-[580px]"
      className="bg-white rounded-[12px] px-4 sm:px-6 py-6 sm:py-8"
    >
      {/* 상단 닫기 버튼 */}
      <div className="flex w-full justify-end">
        <button onClick={onClose} className="w-6 h-6">
          <img src={exitIcon} alt="닫기" className="w-full h-full" />
        </button>
      </div>

      {/* 본문 */}
      <div className="mx-auto w-full max-w-[460px] flex flex-col items-center text-center gap-5 sm:gap-6">
        <span className="text-head-24-bold">
          트러블슈팅을 {templateLabel} 양식으로 요약합니다!
        </span>

        <div className="w-24 h-24 sm:w-[110px] sm:h-[110px]">
          <CircularProgressbar
            value={safeProgress}
            text={`${safeProgress}%`}
            styles={buildStyles({
              textSize: "16px",
              pathColor: ui.color,
              textColor: "#111827",
              trailColor: ui.trail,
              pathTransition: "stroke-dashoffset 0.4s ease-in-out",
              strokeLinecap: "round",
            })}
            strokeWidth={10}
          />
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-body-20-regular text-gray-700">{ui.label}</span>
          <span className="text-body-20-regular text-gray-400">
            {serverMessage && serverMessage.trim().length > 0
              ? serverMessage
              : ui.desc}
          </span>
        </div>

        {/* 실패 시 경고 안내 */}
        {status === "FAILED" && (
          <div
            role="alert"
            className="w-full max-w-[460px] mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left"
          >
            <p className="text-body-16-regular text-red-700">
              {serverMessage?.trim() ||
                "요약 생성에 실패했습니다. 잠시 후 다시 시도해 주세요."}
            </p>
            {/* 필요하면 재시도 버튼을 노출하세요.
          <div className="mt-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-md bg-red-600 text-white">
              닫기
            </button>
          </div>
          */}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
