import KakaoLogo from "../../assets/images/kakaologo.png";
import { KAKAO_REDIRECT_URI } from "../../config";

const LoginButton = () => {
  const url = KAKAO_REDIRECT_URI;

  const handleLogin = () => {
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
    <button type="button" onClick={handleLogin}>
      <img
        src={KakaoLogo}
        alt="kakao logo"
        style={{ display: "inline-block", width: "24px", marginRight: "8px" }}
      />
      Kakao Login
    </button>
  );
};

export default LoginButton;
