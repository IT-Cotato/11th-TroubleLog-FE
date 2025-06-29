// src/pages/Oauth.tsx
import { useEffect } from "react";
import axios from "axios";

const Oauth = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    const GRANT_TYPE = "authorization_code";
    const client_id = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const redirect_uri = import.meta.env.VITE_APP_REDIRECT_URI;
    const tokenUrl = "https://kauth.kakao.com/oauth/token";
    const userInfoUrl = "https://kapi.kakao.com/v2/user/me";

    const getTokenAndUserInfo = async () => {
      try {
        // 1. Access Token 요청
        const tokenRes = await axios.post(
          tokenUrl,
          new URLSearchParams({
            grant_type: GRANT_TYPE,
            client_id,
            redirect_uri,
            code: code || "",
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
            },
          }
        );

        const accessToken = tokenRes.data.access_token;
        localStorage.setItem("kakao_access_token", accessToken); //  토큰 저장

        // 2. 사용자 정보 요청
        const userRes = await axios.get(userInfoUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const profile = userRes.data;
        console.log("카카오 사용자 정보:", profile);

        // 필요하면 사용자 정보 저장..?
        localStorage.setItem("kakao_user", JSON.stringify(profile));

        // 홈으로 이동
        window.location.href = "/";
      } catch (error) {
        console.error("카카오 로그인 오류:", error);
      }
    };

    if (code) getTokenAndUserInfo();
  }, []);

  return <div>카카오 로그인 중입니다...</div>;
};

export default Oauth;
