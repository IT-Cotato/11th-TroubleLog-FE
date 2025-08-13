import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import App from "./App";

const ROOT = document.getElementById("root")!;

function shouldUseMocking() {
  // DEV 모드 + 환경변수 true 일 때만 MSW 시도
  return (
    import.meta.env.DEV && String(import.meta.env.VITE_API_MOCKING) === "true"
  );
}

async function enableMocking() {
  if (!shouldUseMocking()) return;

  // 브라우저 환경/HMR 중복 방지
  if (typeof window === "undefined" || (window as any).__MSW_STARTED) return;

  try {
    // mocks/browser.ts 가 없어도 try-catch로 안전하게 무시
    const mod = await import("./mocks/browser");
    if (!mod?.worker) {
      console.warn('[MSW] "worker" 가 없어 mock을 건너뜁니다.');
      return;
    }

    const start = Date.now();

    const startPromise = mod.worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
      },
    });

    // 안전 타임아웃 (3s)
    await Promise.race([
      startPromise,
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error("MSW start timeout")), 3000)
      ),
    ]);

    (window as any).__MSW_STARTED = true;
    console.info(`[MSW] started in ${Date.now() - start}ms`);
  } catch (e) {
    // 모듈 미존재/등록 실패 등 → 실서버로 진행
    if (import.meta.env.DEV) {
      console.warn("[MSW] 시작 실패. 실제 API로 진행합니다.", e);
    }
  }
}

// mocking이 꺼져있는데도 이전에 등록된 mock SW가 남아있으면 정리
async function cleanupStaleMockSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => r.active?.scriptURL?.includes("mockServiceWorker.js"))
        .map((r) => r.unregister())
    );
  } catch {
    // 무시
  }
}

(async function bootstrap() {
  // OFF 모드에서는 잔류 mock SW 정리
  if (!shouldUseMocking()) {
    cleanupStaleMockSW();
  }

  await enableMocking();

  ReactDOM.createRoot(ROOT).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
})();
