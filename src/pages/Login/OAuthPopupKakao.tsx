import { useEffect } from "react";

type SocialPayload = {
  email?: string;
  status?: string; // "INCOMPLETE" 등
  id?: number;
  nickname?: string;
  loginType?: string; // "KAKAO"
};

export default function OAuthPopupKakao() {
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);

    // 서버가 넘겨준 값
    const payloadFromQuery: SocialPayload = {
      email: sp.get("email") ?? undefined,
      status: sp.get("status") ?? undefined,
      nickname: sp.get("nickname") ?? undefined,
      loginType: sp.get("loginType") ?? undefined,
      id: sp.get("id") ? Number(sp.get("id")) : undefined,
    };

    const error = sp.get("error");
    const opener = window.opener;

    // 보안: 정확한 오리진으로만 전송
    const TARGET = window.location.origin;

    if (opener) {
      opener.postMessage(
        {
          type: "SOCIAL_LOGIN_DONE",
          payload: error
            ? { error, ok: false }
            : { ...payloadFromQuery, ok: true },
        },
        TARGET
      );
    }

    // 주소 정리
    try {
      if ("replaceState" in window.history) {
        window.history.replaceState(null, "", "/");
      }
    } catch (err) {
      console.debug("replaceState failed in popup:", err);
    }

    // 팝업 닫기
    window.close();
  }, []);

  return null;
}
