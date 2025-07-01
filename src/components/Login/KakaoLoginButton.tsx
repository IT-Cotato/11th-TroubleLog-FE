import KakaoLogo from "../../assets/images/kakaologo.svg";
import { KAKAO_REDIRECT_URI } from "../../config";
import "./KakaoLoginButton.css";
const KakaoLoginButton = () => {
  const url = KAKAO_REDIRECT_URI;

  const KakaoLogin = () => {
    const { Kakao } = window as any;
    if (!Kakao || !Kakao.Auth) {
      console.error("Kakao SDK not loaded");
      return;
    }

    Kakao.Auth.authorize({
      redirectUri: url,
      scope: "profile_nickname",
    });
  };

  return (
    <button type="button" className="KakaoLogin" onClick={KakaoLogin}>
      <img src={KakaoLogo} className="KakaoLogo" />
      <span className="KakaoLoginText"> 카카오 로그인</span>
    </button>
  );
};

export default KakaoLoginButton;
