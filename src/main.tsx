import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import App from "./App.tsx";

async function enableMocking() {
  // 개발환경 + 환경변수로 제어 (원할 때만 mock)
  if (!(import.meta.env.DEV && import.meta.env.VITE_API_MOCKING === "true"))
    return;

  // HMR 중복 방지
  if (typeof window !== "undefined" && (window as any).__MSW_STARTED) return;

  const { worker } = await import("./mocks/browser.ts");
  await worker.start({
    onUnhandledRequest: "bypass", // 지정하지 않은 api는 실제 호출
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
  });
  (window as any).__MSW_STARTED = true;
}

async function bootstrap() {
  try {
    await enableMocking();
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[MSW] start 실패, 실제 API로 진행합니다.", err);
    }
  } finally {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}
bootstrap();
