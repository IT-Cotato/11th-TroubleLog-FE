import { Suspense, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import AlertSSEProvider from "./sse";
import { startRefresh } from "@/api/axios";
import { useAuthHydrated } from "@/store/auth";

/**
 * 전역 부트스트랩:
 * - Zustand persist가 rehydrate 된 뒤(hydrated=true)
 * - accessToken이 없으면 1회 refresh 시도
 * - 완료 전까지 children 렌더 지연(깜빡임/오동작 방지)
 */
function AuthBootstrap({ children }: PropsWithChildren) {
  const hydrated = useAuthHydrated();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!hydrated) return; // 스토어 복원 끝난 뒤 동작

      // 토큰 없으면 1회 리프레시 시도
      if (!localStorage.getItem("accessToken")) {
        try {
          await startRefresh(); // 성공하면 내부에서 localStorage.setItem("accessToken", ...) 수행
        } catch {
          // 실패는 무시(비로그인 상태로 진행)
        }
      }

      if (mounted) setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, [hydrated]);

  // 부트스트랩 완료 전에는 렌더 보류
  if (!ready) return null;
  return <>{children}</>;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={null}>
      <AuthBootstrap>
        <AlertSSEProvider>{children}</AlertSSEProvider>
      </AuthBootstrap>
    </Suspense>
  );
}
