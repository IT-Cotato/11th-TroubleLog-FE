import { useEffect } from "react";
import { isAxiosError } from "axios";
import { getSummaryStatus } from "@/api/post.api";
import { startRefresh } from "@/api/axios";
import type { SummaryStatus } from "@/shared/ui/Modal/PostLoadingModal";

export interface UseSummaryPollingOptions {
  postId: number | null;
  summaryTaskId: string | null;
  isActive: boolean;
  onProgress: (progress: number) => void;
  onStatus: (status: SummaryStatus | null) => void;
  onMessage: (message: string) => void;
  onComplete: (postSummaryId?: number) => void;
}

export function useSummaryPolling({
  postId,
  summaryTaskId,
  isActive,
  onProgress,
  onStatus,
  onMessage,
  onComplete,
}: UseSummaryPollingOptions) {
  useEffect(() => {
    if (!isActive || !postId || !summaryTaskId) return;

    let stopped = false;
    let timer: number | null = null;

    const tick = async () => {
      const awaitRefreshIfAny = async () => {
        const p = (window as any).__authRefreshPromise as Promise<
          string | null
        > | null;
        if (p) {
          try {
            await p;
          } catch {
            /* ignore */
          }
        }
      };

      try {
        await awaitRefreshIfAny();

        const fetchOnce = () =>
          getSummaryStatus(postId, summaryTaskId, {
            __skipGlobalAuthGuard: true,
          });

        let data: any;
        try {
          data = await fetchOnce();
        } catch (e) {
          if (isAxiosError(e) && e.response?.status === 401) {
            const inflight = (window as any).__authRefreshPromise as Promise<
              string | null
            > | null;
            const token = inflight ? await inflight : await startRefresh();
            if (!token) throw e;

            data = await getSummaryStatus(postId, summaryTaskId, {
              __skipGlobalAuthGuard: true,
              headers: { Authorization: `Bearer ${token}` },
            });
          } else {
            throw e;
          }
        }

        if (stopped) return;

        const p = Math.max(0, Math.min(100, data?.progress ?? 0));
        onProgress(p);
        if (data?.status) onStatus(data.status as SummaryStatus);

        if (data?.currentStep) onMessage(data.currentStep);
        else if (data?.message) onMessage(data.message);
        else if (
          data?.result &&
          typeof data.result === "object" &&
          "message" in (data.result as any)
        ) {
          onMessage((data.result as any).message ?? "");
        }

        const isTerminal =
          data?.status === "COMPLETED" ||
          data?.status === "FAILED" ||
          data?.status === "CANCELLED" ||
          p >= 100;

        if (isTerminal) {
          if (data?.status === "COMPLETED" || p >= 100) {
            onProgress(100);
            onComplete(
              typeof data?.postSummaryId === "number" ? data.postSummaryId : undefined
            );
          } else {
            onComplete(undefined);
          }
          if (timer !== null) {
            clearInterval(timer);
            timer = null;
          }
        }
      } catch (err) {
        console.error("poll tick error:", err);
      }
    };

    tick();
    timer = window.setInterval(tick, 1200);

    return () => {
      stopped = true;
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, [isActive, postId, summaryTaskId, onProgress, onStatus, onMessage, onComplete]);
}
