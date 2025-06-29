import KakaoLogo from "../../assets/images/kakaologo.png";

const LoginButton = () => {
  const url = "http://localhost:5173/oauth"; // 이건 실제 배포 시에는 redirectUri로 바꾸기!

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
