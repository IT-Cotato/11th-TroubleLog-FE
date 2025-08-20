export function openOAuthPopup(
  authUrl: string,
  targetOrigin: string,
  { eventType = "SOCIAL_LOGIN_DONE", timeoutMs = 120_000 } = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = 480,
      h = 640;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;

    const opened = window.open(
      authUrl,
      "oauth_popup",
      `width=${w},height=${h},left=${left},top=${top}`
    );
    if (!opened) {
      reject(new Error("팝업이 차단되었습니다."));
      return;
    }
    const popup: Window = opened;

    let done = false;
    const cleanup = () => {
      done = true;
      window.removeEventListener("message", onMessage);
      clearInterval(closeWatch);
      clearTimeout(timeoutTimer);
    };

    function onMessage(e: MessageEvent) {
      if (done) return;
      if (e.origin !== targetOrigin) return;
      const msg = e.data;
      if (!msg || msg.type !== eventType) return;

      cleanup();
      try {
        if (!popup.closed) popup.close();
      } catch (err) {
        console.debug("popup.close failed:", err);
      }
      resolve(msg.payload);
    }

    const closeWatch = setInterval(() => {
      if (popup.closed && !done) {
        cleanup();
        reject(new Error("팝업이 닫혔습니다."));
      }
    }, 400);

    const timeoutTimer = setTimeout(() => {
      if (!done) {
        cleanup();
        try {
          if (!popup.closed) popup.close();
        } catch {
          //
        }
        reject(new Error("로그인 시간이 초과되었습니다."));
      }
    }, timeoutMs);

    window.addEventListener("message", onMessage);
  });
}
