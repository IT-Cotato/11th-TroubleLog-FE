import { useEffect } from "react";

type Payload = {
  userId?: number;
  nickname?: string;
  loginType?: string;
  userStatus?: string; // "INCOMPLETE" 등
  accessToken?: string; // 이미 가입 케이스에서 존재
};

function getParam(name: string) {
  const qs = new URLSearchParams(window.location.search);
  const hs = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return qs.get(name) ?? hs.get(name) ?? undefined;
}

export default function OAuthPopupKakao() {
  useEffect(() => {
    const userIdStr = getParam("userId");
    const payload: Payload = {
      userId: userIdStr ? Number(userIdStr) : undefined,
      nickname: getParam("nickname"),
      loginType: getParam("loginType"),
      userStatus: getParam("userStatus") ?? getParam("status"),
      accessToken: getParam("accessToken"),
    };

    // 새로고침 대비 저장(옵션)
    try {
      sessionStorage.setItem("oauth_payload", JSON.stringify(payload));
    } catch (err) {
      console.debug("sessionStorage set failed:", err);
    }

    try {
      const TARGET = window.location.origin;
      if (window.opener) {
        window.opener.postMessage(
          { type: "SOCIAL_LOGIN_DONE", payload },
          TARGET
        );
      }
    } catch (err) {
      console.debug("postMessage failed:", err);
    }

    try {
      if ("replaceState" in window.history) {
        window.history.replaceState(null, "", "/");
      }
    } catch (err) {
      console.debug("replaceState failed:", err);
    }

    window.close();
  }, []);

  return null;
}
