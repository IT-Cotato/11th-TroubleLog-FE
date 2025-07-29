import KakaoLogo from "../../../public/icons/kakaologo.svg";
import { KAKAO_REDIRECT_URI } from "../../config";

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
    <button
      type="button"
      onClick={KakaoLogin}
      className="flex items-center justify-center gap-2 py-3 px-[208px] rounded-lg bg-[#FEE500] w-full"
    >
      <img src={KakaoLogo} className="w-[18px] h-[18px]" alt="kakao" />
      <span className="text-[20px] font-semibold leading-normal text-[rgba(0,0,0,0.85)] font-pretendard">
        카카오 로그인
      </span>
    </button>
  );
};

export default KakaoLoginButton;
