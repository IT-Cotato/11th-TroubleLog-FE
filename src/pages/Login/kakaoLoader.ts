declare global {
  interface Window {
    Kakao: any;
  }
}

const SDK_URL = "https://developers.kakao.com/sdk/js/kakao.min.js";

function injectScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Kakao SDK"));
    document.head.appendChild(s);
  });
}

export async function ensureKakaoReady() {
  await injectScript(SDK_URL);

  const Kakao = window.Kakao;
  if (!Kakao) throw new Error("Kakao SDK not available");

  if (!Kakao.isInitialized()) {
    const jsKey = import.meta.env.VITE_KAKAO_JS_SDK_KEY;
    if (!jsKey) throw new Error("Missing VITE_KAKAO_JS_SDK_KEY");
    Kakao.init(jsKey);
  }
  return Kakao;
}
