import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PATH } from "@/shared/config/paths";
import { applyAuth } from "@/utils/applyAuth";
import { devLog } from "@/shared/utils/logger";

type SocialPayload = {
  userId?: number;
  nickname?: string;
  loginType?: string;
  userStatus?: string; // 또는 status
  accessToken?: string; // 바로 로그인 케이스
};

const getParam = (name: string) => {
  const qs = new URLSearchParams(window.location.search);
  const hs = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return qs.get(name) ?? hs.get(name) ?? undefined;
};

export default function OAuthPopupKakao() {
  const navigate = useNavigate();

  useEffect(() => {
    const href = window.location.href;
    const isPopup = !!window.opener && !window.opener.closed;
    devLog.debug("[OAuthPopupKakao] mounted @", href, "isPopup:", isPopup);

    // payload 파싱
    const uid = getParam("userId") ?? getParam("userid");
    const payload: SocialPayload = {
      userId: uid ? Number(uid) : undefined,
      nickname: getParam("nickname") ?? undefined,
      loginType: getParam("loginType") ?? undefined,
      userStatus: getParam("userStatus") ?? getParam("status") ?? undefined,
      accessToken: getParam("accessToken") ?? undefined,
    };
    devLog.debug("[OAuthPopupKakao] parsed payload:", payload);

    // 임시 저장(새로고침 대비)
    try {
      sessionStorage.setItem("oauth_payload", JSON.stringify(payload));
      devLog.debug("[OAuthPopupKakao] session saved");
    } catch (err) {
      devLog.debug("[OAuthPopupKakao] session save failed:", err);
    }

    if (isPopup) {
      // ✅ 팝업일 때만 postMessage/close/replaceState 수행
      try {
        const TARGET = window.location.origin;
        window.opener?.postMessage(
          { type: "SOCIAL_LOGIN_DONE", payload },
          TARGET
        );
        devLog.debug("[OAuthPopupKakao] postMessage sent →", TARGET);
      } catch (err) {
        devLog.debug("[OAuthPopupKakao] postMessage failed:", err);
      }

      try {
        if ("replaceState" in window.history) {
          window.history.replaceState(null, "", "/");
          devLog.debug("[OAuthPopupKakao] URL cleaned");
        }
      } catch (err) {
        devLog.debug("[OAuthPopupKakao] replaceState failed:", err);
      }

      try {
        devLog.debug("[OAuthPopupKakao] closing popup");
        window.close();
      } catch (err) {
        devLog.debug("[OAuthPopupKakao] window.close failed:", err);
      }
    } else {
      // 🧩 직접 진입(새 탭/리다이렉트로 열림) 처리: SPA 내에서 마무리
      devLog.debug("[OAuthPopupKakao] opened directly — handling in-page");

      const status = payload.userStatus ?? getParam("status") ?? undefined;
      if (payload.accessToken) {
        // 이미 가입 → 바로 로그인 처리
        applyAuth(payload.accessToken);
        navigate(PATH.HOME, { replace: true });
        return;
      }
      if (status === "INCOMPLETE" && payload.userId) {
        navigate(PATH.SIGNUP_OAUTH, {
          replace: true,
          state: { userId: payload.userId, nickname: payload.nickname ?? "" },
        });
        return;
      }
      // 그래도 조건이 안 맞으면 루트로
      navigate(PATH.LOGIN, { replace: true });
    }
  }, [navigate]);

  return null;
}
