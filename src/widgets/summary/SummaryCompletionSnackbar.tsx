import { useCallback, useLayoutEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATH } from "@/shared/config/paths";
import { useSummaryCompletionSnackbarStore } from "@/store/useSummaryCompletionSnackbarStore";
import { useSummaryJobStore } from "@/store/useSummaryJobStore";

const WRITE_PATHS = new Set<string>([PATH.TEMP_WRITING, PATH.FREEFORM_WRITING]);

function isSummaryWritePath(pathname: string) {
  return WRITE_PATHS.has(pathname);
}

/**
 * BE 폴링 완료 후 하단 스낵바 + "결과 확인" 시 합본 상세로 이동
 */
export function SummaryCompletionSnackbar() {
  const pending = useSummaryCompletionSnackbarStore((s) => s.pending);
  const consume = useSummaryCompletionSnackbarStore((s) => s.consume);
  const location = useLocation();
  const navigate = useNavigate();

  const onWriteScreen = useMemo(
    () => isSummaryWritePath(location.pathname),
    [location.pathname],
  );

  const showSnackbar = Boolean(pending) && !onWriteScreen;

  useLayoutEffect(() => {
    if (!showSnackbar || !pending) return;
    useSummaryJobStore.getState().reset();
  }, [showSnackbar, pending]);

  const handleResult = useCallback(() => {
    if (!pending) return;
    navigate(PATH.COMBINED_DETAIL(pending.postId, pending.summaryId));
    consume();
  }, [pending, navigate, consume]);

  const handleDismiss = useCallback(() => {
    consume();
  }, [consume]);

  if (!showSnackbar || !pending) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[9990] flex w-[min(100%-2rem,28rem)] -translate-x-1/2 flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-[0_8px_32px_rgba(15,23,42,0.14)] sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <p className="text-center text-body-16-regular text-gray-900 sm:text-left">
        요약이 완료되었습니다!
      </p>
      <div className="flex shrink-0 items-center justify-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg px-3 py-1.5 text-body-16-regular text-gray-600 hover:bg-gray-100"
        >
          닫기
        </button>
        <button
          type="button"
          onClick={handleResult}
          className="rounded-lg bg-purple-600 px-4 py-1.5 text-body-16-regular font-semibold text-white hover:bg-purple-700"
        >
          결과 확인
        </button>
      </div>
    </div>
  );
}
