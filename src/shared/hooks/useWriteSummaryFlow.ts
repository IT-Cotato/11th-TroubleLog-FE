import { useCallback } from "react";
import { editPost, startSummary, cancelSummary } from "@/api/post.api";
import type { EditPostRequest } from "@/models/post.model";
import type { SummaryTypeParam, StartLoadingResponse } from "@/models/post.model";
import type { SummaryStatus } from "@/shared/ui/Modal/PostLoadingModal";

export interface UseWriteSummaryFlowOptions {
  postId: number | null;
  summaryTaskId: string | null;
  summaryProgress: number;
  setSummaryTaskId: (v: string | null) => void;
  setSummaryProgress: (v: number) => void;
  setSummaryStatus: (v: SummaryStatus | null) => void;
  setStatusMessage: (v: string) => void;
  setTemplateLabel: (v: string) => void;
  setIsTemplateSelectModalOpen: (v: boolean) => void;
  setIsLoadingModalOpen: (v: boolean) => void;
  setCreatedPostId: (v: number | null) => void;
  setShowCancelAlert: (v: boolean) => void;
  /** ms to show cancel toast after closing loading modal. Default 3000. */
  cancelAlertDuration?: number;
}

export interface UseWriteSummaryFlowResult {
  /** 요약 시작: 수정 API 호출 후 startSummary, 모달/상태 업데이트. getEditRequestBody는 페이지에서 buildEditFormFromMeta 등으로 생성한 EditPostRequest 반환 */
  runConfirmTemplate: (
    type: SummaryTypeParam,
    label: string,
    getEditRequestBody: () => Promise<EditPostRequest>
  ) => Promise<void>;
  /** 로딩 모달 닫기(요약 취소). closingRef는 페이지에서 관리해 중복 호출 방지 */
  closeLoadingModal: (closingRef: { current: boolean }) => Promise<void>;
}

export function useWriteSummaryFlow(
  options: UseWriteSummaryFlowOptions
): UseWriteSummaryFlowResult {
  const {
    postId,
    summaryTaskId,
    summaryProgress,
    setSummaryTaskId,
    setSummaryProgress,
    setSummaryStatus,
    setStatusMessage,
    setTemplateLabel,
    setIsTemplateSelectModalOpen,
    setIsLoadingModalOpen,
    setCreatedPostId,
    setShowCancelAlert,
    cancelAlertDuration = 3000,
  } = options;

  const runConfirmTemplate = useCallback(
    async (
      type: SummaryTypeParam,
      label: string,
      getEditRequestBody: () => Promise<EditPostRequest>
    ) => {
      if (!postId) return;
      try {
        const body = await getEditRequestBody();
        await editPost(postId, body);

        setIsTemplateSelectModalOpen(false);
        setIsLoadingModalOpen(true);
        setSummaryProgress(0);
        setSummaryStatus(null);
        setStatusMessage("");
        setTemplateLabel(label);

        const res: StartLoadingResponse = await startSummary(postId, type);
        const taskId =
          (res as any).taskId ??
          (res as any).data?.taskId ??
          (res as any).content?.taskId;

        if (!taskId) throw new Error("요약 작업 ID(taskId)를 찾을 수 없어요.");
        setSummaryTaskId(taskId);
      } catch (e) {
        console.error(e);
        setIsLoadingModalOpen(false);
        setIsTemplateSelectModalOpen(true);
        setSummaryTaskId(null);
        setCreatedPostId(null);
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
      setTemplateLabel,
      setIsTemplateSelectModalOpen,
      setIsLoadingModalOpen,
      setCreatedPostId,
    ]
  );

  const closeLoadingModal = useCallback(
    async (closingRef: { current: boolean }) => {
      if (closingRef.current) return;
      closingRef.current = true;
      try {
        if (summaryProgress < 100 && postId && summaryTaskId) {
          try {
            await cancelSummary(postId, summaryTaskId);
          } catch (e) {
            console.error("요약 작업 취소 실패:", e);
          }
        }
        setIsLoadingModalOpen(false);
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
      setIsLoadingModalOpen,
      setSummaryTaskId,
      setSummaryProgress,
      setShowCancelAlert,
      cancelAlertDuration,
    ]
  );

  return { runConfirmTemplate, closeLoadingModal };
}
