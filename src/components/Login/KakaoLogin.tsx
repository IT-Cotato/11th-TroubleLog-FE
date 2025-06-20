import { KAKAO_AUTH_URL } from "../../config";

interface LoginButtonProps {
  onClick: () => void;
}

const LoginButton = ({ onClick }: LoginButtonProps) => {
  return <button onClick={onClick}>카카오 로그인</button>;
};

const KakaoLogin = () => {
  const link: string = KAKAO_AUTH_URL;

  const handleLogin = () => {
    window.location.href = link;
  };

  return (
    <div>
      <LoginButton onClick={handleLogin} />
    </div>
  );
};

export default KakaoLogin;
