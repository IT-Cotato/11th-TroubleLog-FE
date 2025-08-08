import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import App from "./App.tsx";

async function enableMocking() {
  // 개발환경 + 환경변수로 제어 (원할 때만 mock)
  if (import.meta.env.DEV && import.meta.env.VITE_API_MOCKING === "true") {
    const { worker } = await import("./mocks/browser.ts");
    await worker.start({
      onUnhandledRequest: "bypass", // 지정하지 않은 api는 실제 호출
      serviceWorker: {
        url: "/mockServiceWorker.js",
      },
    });
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
