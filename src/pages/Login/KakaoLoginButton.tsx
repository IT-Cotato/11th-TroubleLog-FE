import kakaoLogoIcon from "@/assets/icons/kakaologo.svg";
import { PATH } from "@/constants/paths";

const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const FRONT_CALLBACK = `${window.location.origin}${BASE}${PATH.OAUTH_REGISTER}`;
const AUTH_START_URL = `https://troublog.shop/oauth2/authorization/kakao?return_to=${encodeURIComponent(
  FRONT_CALLBACK
)}`;

export default function KakaoLoginButton() {
  const handleClick = () => {
    // 팝업 없이 풀리다이렉트
    window.location.href = AUTH_START_URL;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center gap-2 py-3 px-[208px] rounded-lg bg-[#FEE500] w-full"
    >
      <img src={kakaoLogoIcon} className="w-[18px] h-[18px]" alt="kakao" />
      <span className="text-[20px] font-semibold">카카오 로그인</span>
    </button>
  );
}
