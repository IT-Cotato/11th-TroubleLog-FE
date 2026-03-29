import { useCallback } from "react";
import { useSummaryPolling } from "@/shared/hooks/useSummaryPolling";
import type { SummaryStatus } from "@/shared/ui/Modal/PostLoadingModal";
import { useSummaryJobStore } from "@/store/useSummaryJobStore";

/**
 * 요약 작업 폴링을 앱 전역에서 한 번만 수행
 * 작성 페이지를 벗어나도 진행 상태가 유지
 */
export function SummaryJobPoller() {
  const postId = useSummaryJobStore((s) => s.postId);
  const taskId = useSummaryJobStore((s) => s.taskId);
  const phase = useSummaryJobStore((s) => s.phase);

  const onProgress = useCallback((progress: number) => {
    useSummaryJobStore.getState().applyPollUpdate({ progress });
  }, []);

  const onStatus = useCallback((status: SummaryStatus | null) => {
    useSummaryJobStore.getState().applyPollUpdate({ summaryStatus: status });
  }, []);

  const onMessage = useCallback((message: string) => {
    useSummaryJobStore.getState().applyPollUpdate({ statusMessage: message });
  }, []);

  const onComplete = useCallback((postSummaryId?: number) => {
    const st = useSummaryJobStore.getState();
    if (st.phase !== "running") return;
    const status = st.summaryStatus;
    if (status === "FAILED" || status === "CANCELLED") {
      st.markFailed();
      return;
    }
    st.markComplete(postSummaryId);
  }, []);

  useSummaryPolling({
    postId,
    summaryTaskId: taskId,
    isActive: phase === "running" && postId != null && taskId != null,
    onProgress,
    onStatus,
    onMessage,
    onComplete,
  });

  return null;
}
