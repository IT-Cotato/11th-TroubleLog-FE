import { create } from "zustand";
import type { SummaryStatus } from "@/shared/ui/Modal/PostLoadingModal";
import { useSummaryCompletionSnackbarStore } from "@/store/useSummaryCompletionSnackbarStore";

export type SummaryJobPhase = "idle" | "running" | "completed" | "failed";

interface SummaryJobState {
  phase: SummaryJobPhase;
  postId: number | null;
  taskId: string | null;
  progress: number;
  summaryStatus: SummaryStatus | null;
  statusMessage: string;
  templateLabel: string;
  postSummaryId: number | undefined;

  startJob: (args: {
    postId: number;
    taskId: string;
    templateLabel: string;
  }) => void;
  applyPollUpdate: (patch: {
    progress?: number;
    summaryStatus?: SummaryStatus | null;
    statusMessage?: string;
  }) => void;
  markComplete: (postSummaryId?: number) => void;
  markFailed: () => void;
  reset: () => void;
}

const initial = (): Omit<
  SummaryJobState,
  | "startJob"
  | "applyPollUpdate"
  | "markComplete"
  | "markFailed"
  | "reset"
> => ({
  phase: "idle",
  postId: null,
  taskId: null,
  progress: 0,
  summaryStatus: null,
  statusMessage: "",
  templateLabel: "",
  postSummaryId: undefined,
});

export const useSummaryJobStore = create<SummaryJobState>((set, get) => ({
  ...initial(),

  startJob: ({ postId, taskId, templateLabel }) =>
    set({
      phase: "running",
      postId,
      taskId,
      templateLabel,
      progress: 0,
      summaryStatus: null,
      statusMessage: "",
      postSummaryId: undefined,
    }),

  applyPollUpdate: (patch) =>
    set((s) => ({
      progress:
        patch.progress !== undefined ? patch.progress : s.progress,
      summaryStatus:
        patch.summaryStatus !== undefined
          ? patch.summaryStatus
          : s.summaryStatus,
      statusMessage:
        patch.statusMessage !== undefined
          ? patch.statusMessage
          : s.statusMessage,
    })),

  markComplete: (postSummaryId) => {
    const postId = get().postId;
    set({
      phase: "completed",
      progress: 100,
      postSummaryId,
    });
    if (typeof postSummaryId === "number" && postId != null) {
      useSummaryCompletionSnackbarStore.getState().offer({
        postId,
        summaryId: postSummaryId,
      });
    }
  },

  markFailed: () => set({ phase: "failed" }),

  reset: () => set(initial()),
}));
