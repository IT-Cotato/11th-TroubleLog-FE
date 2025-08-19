import axios from "axios";

type Options = {
  eventType?: string; // 콜백 페이지가 보낼 postMessage 타입
  pollIntervalMs?: number; // 세션 폴링 주기
  pollTimeoutMs?: number; // 세션 폴링 타임아웃
  meEndpoint?: string; // 세션 조회 API
};

export function openOAuthPopup(
  authUrl: string,
  targetOrigin: string,
  {
    eventType = "SOCIAL_LOGIN_DONE",
    pollIntervalMs = 800,
    pollTimeoutMs = 90_000,
    meEndpoint = "/api/users/me",
  }: Options = {}
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
      clearInterval(pollTimer);
      clearTimeout(timeoutTimer);
    };

    // postMessage 경로 (백엔드가 콜백/HTML 준비 후 적용될 때)
    function onMessage(e: MessageEvent) {
      if (done) return;
      if (e.origin !== targetOrigin) return;
      const msg = e.data;
      if (!msg || msg.type !== eventType) return;

      cleanup();
      try {
        if (!popup.closed) popup.close();
      } catch (err) {
        console.debug(err);
      }
      resolve(msg.payload);
    }
    window.addEventListener("message", onMessage);

    // 세션 폴링 경로 (백엔드 수정 없이도 동작)
    const pollTimer = setInterval(async () => {
      if (done) return;
      if (popup.closed) {
        cleanup();
        reject(new Error("사용자가 팝업을 닫았습니다."));
        return;
      }
      try {
        const res = await axios.get(meEndpoint, { withCredentials: true });
        // 로그인 성공 판단: 프로젝트 규칙에 맞게 조정
        if (res?.data) {
          cleanup();
          try {
            if (!popup.closed) popup.close();
          } catch (err) {
            console.debug(err);
          }
          resolve(res.data); // ex) { email, status, id, nickname, loginType }
        }
      } catch {
        // 아직 로그인 안 됨 → 다음 폴링으로
      }
    }, pollIntervalMs);

    const timeoutTimer = setTimeout(() => {
      if (done) return;
      cleanup();
      try {
        if (!popup.closed) popup.close();
      } catch (err) {
        console.debug(err);
      }
      reject(new Error("로그인 시간이 초과되었습니다."));
    }, pollTimeoutMs);
  });
}
