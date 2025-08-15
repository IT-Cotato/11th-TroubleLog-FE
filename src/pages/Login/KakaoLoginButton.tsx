import kakaoLogoIcon from "@/assets/icons/kakaologo.svg";
import { ensureKakaoReady } from "./kakaoLoader";
import { KAKAO_REDIRECT_URI } from "../../config";
import { useState } from "react";

const KakaoLoginButton = () => {
  const [loading, setLoading] = useState(false);
  const redirectUri = KAKAO_REDIRECT_URI;

  const onKakaoLogin = async () => {
    try {
      setLoading(true);
      const Kakao = await ensureKakaoReady();
      Kakao.Auth.authorize({
        redirectUri,
        scope: "profile_nickname",
        throughTalk: false,
      });
    } catch (e) {
      console.error(e);
      alert("카카오 로그인 초기화에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onKakaoLogin}
      disabled={loading}
      className="flex items-center justify-center gap-2 py-3 px-[208px] rounded-lg bg-[#FEE500] w-full"
    >
      <img src={kakaoLogoIcon} className="w-[18px] h-[18px]" alt="kakao" />
      <span className="text-[20px] font-semibold leading-normal text-[rgba(0,0,0,0.85)] font-pretendard">
        {loading ? "초기화 중..." : "카카오 로그인"}
      </span>
    </button>
  );
};

export default KakaoLoginButton;
