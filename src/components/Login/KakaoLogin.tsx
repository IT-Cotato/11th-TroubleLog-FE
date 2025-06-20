import KakaoLogo from "../../assets/images/kakaologo.png";

const LoginButton = () => {
  const url = "http://localhost:5173/oauth";

  const handleLogin = () => {
    const { Kakao } = window as any;
    if (!Kakao || !Kakao.Auth) {
      console.error("Kakao SDK not loaded");
      return;
    }

    Kakao.Auth.authorize({
      redirectUri: url,
      scope: "profile_nickname,profile_image,account_email",
    });
  };

  return (
    <button type="button" onClick={handleLogin}>
      <img
        src={KakaoLogo}
        alt="kakao logo"
        style={{
          display: "inline-block",
          width: "24px",
          marginRight: "8px",
        }}
      />
      Kakao Login
    </button>
  );
};

export default LoginButton;
