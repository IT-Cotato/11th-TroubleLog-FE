import clsx from "clsx";
import { useEffect, useState } from "react";
import { useSummaryJobStore } from "@/store/useSummaryJobStore";
import logoSvg from "@/assets/icons/logo.svg";
import loadingDefaultSvg from "@/assets/icons/loading_default.svg";
import loadingFirstSvg from "@/assets/icons/loading_first.svg";
import loadingMedSvg from "@/assets/icons/loading_med.svg";
import loadingFinSvg from "@/assets/icons/loading_fin.svg";
import "./summary-fab.css";

function TroublogMarkIcon() {
  return (
    <img
      src={logoSvg}
      alt=""
      className="h-[18px] w-auto max-h-[18px] max-w-[26px] object-contain brightness-0 invert"
      aria-hidden
    />
  );
}

const LOADING_FRAME_MS = 130;

const LOADING_FRAMES = [
  loadingDefaultSvg,
  loadingFirstSvg,
  loadingDefaultSvg,
  loadingMedSvg,
  loadingDefaultSvg,
  loadingFinSvg,
] as const;

function LoadingFrameSequence() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % LOADING_FRAMES.length);
    }, LOADING_FRAME_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <img
      src={LOADING_FRAMES[frame]}
      alt=""
      className="h-7 w-7 shrink-0 object-contain"
      aria-hidden
    />
  );
}

export function GlobalSummaryFloatingButton() {
  const phase = useSummaryJobStore((s) => s.phase);
  const progress = useSummaryJobStore((s) => s.progress);
  const reset = useSummaryJobStore((s) => s.reset);

  const visible =
    phase === "running" || phase === "completed" || phase === "failed";

  if (!visible) return null;

  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const isRunning = phase === "running";
  const isDone = phase === "completed";
  const isFailed = phase === "failed";

  const label = isDone ? "요약 완료" : isFailed ? "요약 실패" : null;

  const handleClick = () => {
    if (isRunning) return;
    reset();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        "fixed bottom-5 right-5 z-[9999] flex min-h-[52px] items-stretch overflow-hidden rounded-full border border-black/5 bg-white pl-4 pr-1 shadow-[0_8px_32px_rgba(15,23,42,0.12)] transition-transform",
        !isRunning &&
          "cursor-pointer hover:shadow-[0_12px_36px_rgba(15,23,42,0.16)]",
        isRunning && "cursor-default",
      )}
      aria-live="polite"
      aria-label={
        isRunning
          ? `AI 요약 진행 중 ${pct}퍼센트`
          : isDone
            ? "요약이 완료되었습니다. 닫으려면 누르세요."
            : "요약에 실패했습니다. 닫으려면 누르세요."
      }
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 font-sans text-[15px] font-bold text-black">
        {isRunning && (
          <>
            <LoadingFrameSequence />
            <span className="tabular-nums tracking-tight">
              {pct}
              <span className="ml-1 font-bold">%</span>
            </span>
          </>
        )}
        {label != null && (
          <span className="whitespace-nowrap py-0.5">{label}</span>
        )}
      </span>

      <span
        className="relative flex w-[52px] shrink-0 items-center justify-center self-stretch overflow-hidden rounded-full bg-[#9D3BFF] shadow-[0_0_20px_rgba(157,59,255,0.35)]"
        style={{
          marginBottom: "-1px",
          marginTop: "-1px",
        }}
      >
        <span className="relative z-[1] flex items-center justify-center">
          <TroublogMarkIcon />
        </span>
      </span>
    </button>
  );
}
