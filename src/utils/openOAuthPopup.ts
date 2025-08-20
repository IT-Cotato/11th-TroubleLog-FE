export function openOAuthPopup(
  authUrl: string,
  targetOrigin: string,
  { eventType = "SOCIAL_LOGIN_DONE", timeoutMs = 120_000 } = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = 520,
      h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;

    console.debug("[openOAuthPopup] opening:", authUrl);
    const opened = window.open(
      authUrl,
      "oauth_popup",
      `width=${w},height=${h},left=${left},top=${top}`
    );

    if (!opened) {
      const err = new Error("팝업 차단");
      console.error("[openOAuthPopup]", err);
      reject(err);
      return;
    }
    const popup: Window = opened;

    let done = false;
    const cleanup = () => {
      done = true;
      window.removeEventListener("message", onMessage);
      clearInterval(closeWatch);
      clearTimeout(timeoutTimer);
      console.debug("[openOAuthPopup] cleaned up");
    };

    function onMessage(e: MessageEvent) {
      console.debug("[openOAuthPopup] message:", {
        origin: e.origin,
        data: e.data,
      });
      if (done) return;
      if (e.origin !== targetOrigin) return;
      if (!e.data || e.data.type !== eventType) return;

      cleanup();
      try {
        if (!popup.closed) popup.close();
      } catch {
        //
      }
      resolve(e.data.payload);
    }

    const closeWatch = setInterval(() => {
      if (popup.closed && !done) {
        cleanup();
        const err = new Error("팝업이 닫힘");
        console.warn("[openOAuthPopup]", err);
        reject(err);
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
        const err = new Error("로그인 타임아웃");
        console.error("[openOAuthPopup]", err);
        reject(err);
      }
    }, timeoutMs);

    window.addEventListener("message", onMessage);
  });
}
