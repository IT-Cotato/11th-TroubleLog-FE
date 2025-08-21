import { useMemo } from "react";
import kakaoLogoIcon from "@/assets/icons/kakaologo.svg";
import { PATH } from "@/constants/paths";

export default function KakaoLoginButton() {
  const AUTH_START_URL = useMemo(() => {
    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    const callback = `${window.location.origin}${base}${PATH.OAUTH_REGISTER}`;
    return `https://troublog.shop/oauth2/authorization/kakao?return_to=${encodeURIComponent(
      callback
    )}`;
  }, []);

  const handleClick = () => {
    window.location.href = AUTH_START_URL;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center gap-2 py-3 px-[208px] rounded-lg bg-[#FEE500]"
    >
      <img src={kakaoLogoIcon} className="w-[18px] h-[18px]" alt="kakao" />
      <span className="text-[20px] font-semibold leading-normal text-[rgba(0,0,0,0.85)] font-pretendard">
        카카오 로그인
      </span>
    </button>
  );
}
