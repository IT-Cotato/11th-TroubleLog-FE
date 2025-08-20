import { useEffect } from "react";

type SocialPayload = {
  userId?: number;
  nickname?: string;
  loginType?: string;
  userStatus?: string; // 또는 status
  accessToken?: string; // 바로 로그인 케이스에서만 존재
};

const getParam = (name: string) => {
  const qs = new URLSearchParams(window.location.search);
  const hs = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return qs.get(name) ?? hs.get(name) ?? undefined;
};

export default function OAuthPopupKakao() {
  useEffect(() => {
    // 👉 이 로그가 팝업 콘솔에 안 찍히면 "라우트 미매칭"입니다.
    console.debug("[OAuthPopupKakao] mounted:", window.location.href);

    const uid = getParam("userId") ?? getParam("userid"); // 서버가 소문자 보낼 대비
    const payload: SocialPayload = {
      userId: uid ? Number(uid) : undefined,
      nickname: getParam("nickname") ?? undefined,
      loginType: getParam("loginType") ?? undefined,
      userStatus: getParam("userStatus") ?? getParam("status") ?? undefined,
      accessToken: getParam("accessToken") ?? undefined,
    };
    console.debug("[OAuthPopupKakao] parsed payload:", payload);

    try {
      sessionStorage.setItem("oauth_payload", JSON.stringify(payload));
      console.debug("[OAuthPopupKakao] sessionStorage saved");
    } catch (err) {
      console.debug("[OAuthPopupKakao] sessionStorage save failed:", err);
    }

    try {
      const TARGET = window.location.origin;
      if (window.opener) {
        window.opener.postMessage(
          { type: "SOCIAL_LOGIN_DONE", payload },
          TARGET
        );
        console.debug("[OAuthPopupKakao] postMessage sent to", TARGET);
      } else {
        console.debug(
          "[OAuthPopupKakao] window.opener is null (opened directly?)"
        );
      }
    } catch (err) {
      console.debug("[OAuthPopupKakao] postMessage failed:", err);
    }

    try {
      if ("replaceState" in window.history) {
        window.history.replaceState(null, "", "/");
        console.debug("[OAuthPopupKakao] URL cleaned");
      }
    } catch (err) {
      console.debug("[OAuthPopupKakao] replaceState failed:", err);
    }

    console.debug("[OAuthPopupKakao] closing popup");
    window.close();
  }, []);

  return null;
}
