import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  KAKAO_REST_KEY,
  KAKAO_REDIRECT_URI,
  KAKAO_TOKEN_URL,
  KAKAO_CLIENT_SECRET,
  KAKAO_USERINFO_URL,
} from "../../config";

const Oauth = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    const getTokenAndUserInfo = async () => {
      try {
        // 1. Access Token 요청
        const tokenRes = await axios.post(
          KAKAO_TOKEN_URL,
          new URLSearchParams({
            grant_type: "authorization_code",
            client_id: KAKAO_REST_KEY,
            redirect_uri: KAKAO_REDIRECT_URI,
            code: code || "",
            ...(KAKAO_CLIENT_SECRET
              ? { client_secret: KAKAO_CLIENT_SECRET }
              : {}),
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
            },
          }
        );

        // 성공/실패 후 쿼리
        history.replaceState(null, "", location.pathname);

        const accessToken = tokenRes.data.access_token;
        localStorage.setItem("kakao_access_token", accessToken);

        // 2. 사용자 정보 요청
        const userRes = await axios.get(KAKAO_USERINFO_URL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const profile = userRes.data;
        console.log("카카오 사용자 정보:", profile);

        // 필요하면 사용자 정보 저장..?
        localStorage.setItem("kakao_user", JSON.stringify(profile));

        // 홈으로 이동
        navigate("/signup/detail");
      } catch (error) {
        console.error("카카오 로그인 오류:", error);
        navigate("/");
      }
    };
    if (code) {
      getTokenAndUserInfo();
    } else {
      console.error("Authorization code not found in URL");
      navigate("/");
    }
  }, [navigate]);

  return <div>카카오 로그인 중입니다...</div>;
};

export default Oauth;
