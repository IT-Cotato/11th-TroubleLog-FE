import { useMemo } from "react";
import kakaoLogoIcon from "@/assets/icons/kakaologo.svg";
import { PATH } from "@/shared/config/paths";

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
      className="flex w-full h-12 items-center justify-center gap-2 rounded-lg bg-[#FEE500]"
    >
      <img src={kakaoLogoIcon} className="w-[18px] h-[18px]" alt="kakao" />
      <span className="text-head-20-semibold leading-normal text-[rgba(0,0,0,0.85)]">
        카카오 로그인
      </span>
    </button>
  );
}
