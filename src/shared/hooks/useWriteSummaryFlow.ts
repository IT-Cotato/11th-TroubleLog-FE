import { useCallback } from "react";
import { editPost, startSummary, cancelSummary } from "@/api/post.api";
import type { EditPostRequest } from "@/models/post.model";
import type {
  SummaryTypeParam,
  StartLoadingResponse,
} from "@/models/post.model";
import type { SummaryStatus } from "@/shared/ui/Modal/PostLoadingModal";
import { useSummaryJobStore } from "@/store/useSummaryJobStore";

export interface UseWriteSummaryFlowOptions {
  postId: number | null;
  summaryTaskId: string | null;
  summaryProgress: number;
  setSummaryTaskId: (v: string | null) => void;
  setSummaryProgress: (v: number) => void;
  setSummaryStatus: (v: SummaryStatus | null) => void;
  setStatusMessage: (v: string) => void;
  setIsTemplateSelectModalOpen: (v: boolean) => void;
  setCreatedPostId: (v: number | null) => void;
  setShowCancelAlert: (v: boolean) => void;
  /** ms to show cancel toast after closing loading modal. Default 3000. */
  cancelAlertDuration?: number;
}

export interface UseWriteSummaryFlowResult {
  /** 요약 시작 */
  runConfirmTemplate: (
    type: SummaryTypeParam,
    label: string,
    getEditRequestBody: () => Promise<EditPostRequest>,
  ) => Promise<void>;
  /** 요약 작업 취소(백엔드 취소 API + 전역 상태 초기화). 플로팅 UI 등에서 사용 */
  cancelSummaryJob: (closingRef: { current: boolean }) => Promise<void>;
}

export function useWriteSummaryFlow(
  options: UseWriteSummaryFlowOptions,
): UseWriteSummaryFlowResult {
  const {
    postId,
    summaryTaskId,
    summaryProgress,
    setSummaryTaskId,
    setSummaryProgress,
    setSummaryStatus,
    setStatusMessage,
    setIsTemplateSelectModalOpen,
    setShowCancelAlert,
    cancelAlertDuration = 3000,
  } = options;

  const runConfirmTemplate = useCallback(
    async (
      type: SummaryTypeParam,
      label: string,
      getEditRequestBody: () => Promise<EditPostRequest>,
    ) => {
      if (!postId) return;
      try {
        const body = await getEditRequestBody();
        await editPost(postId, body);

        setIsTemplateSelectModalOpen(false);
        setSummaryProgress(0);
        setSummaryStatus(null);
        setStatusMessage("");

        const res: StartLoadingResponse = await startSummary(postId, type);
        const taskId =
          (res as any).taskId ??
          (res as any).data?.taskId ??
          (res as any).content?.taskId;

        if (!taskId) throw new Error("요약 작업 ID(taskId)를 찾을 수 없어요.");
        setSummaryTaskId(taskId);
        useSummaryJobStore.getState().startJob({
          postId,
          taskId,
          templateLabel: label,
        });
      } catch (e) {
        console.error(e);
        useSummaryJobStore.getState().reset();
        setIsTemplateSelectModalOpen(true);
        setSummaryTaskId(null);
        setSummaryProgress(0);
        setSummaryStatus(null);
        setStatusMessage("요약 시작에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    },
    [
      postId,
      setSummaryTaskId,
      setSummaryProgress,
      setSummaryStatus,
      setStatusMessage,
      setIsTemplateSelectModalOpen,
    ],
  );

  const cancelSummaryJob = useCallback(
    async (closingRef: { current: boolean }) => {
      if (closingRef.current) return;
      closingRef.current = true;
      try {
        const job = useSummaryJobStore.getState();
        const progressForCancel =
          job.postId === postId && job.taskId === summaryTaskId
            ? job.progress
            : summaryProgress;
        if (progressForCancel < 100 && postId && summaryTaskId) {
          try {
            await cancelSummary(postId, summaryTaskId);
          } catch (e) {
            console.error("요약 작업 취소 실패:", e);
          }
        }
        useSummaryJobStore.getState().reset();
        setSummaryTaskId(null);
        setSummaryProgress(0);
        setShowCancelAlert(true);
        setTimeout(() => setShowCancelAlert(false), cancelAlertDuration);
      } finally {
        closingRef.current = false;
      }
    },
    [
      postId,
      summaryTaskId,
      summaryProgress,
      setSummaryTaskId,
      setSummaryProgress,
      setShowCancelAlert,
      cancelAlertDuration,
    ],
  );

  return { runConfirmTemplate, cancelSummaryJob };
}
