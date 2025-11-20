import { useMemo } from "react";
import kakaoLogoIcon from "@/assets/icons/kakaologo.svg";
// import { PATH } from "@/shared/config/paths";

const AUTH_SERVER_ORIGIN = "https://troublog.shop"; // 백엔드 고정

export default function KakaoLoginButton() {
  const AUTH_START_URL = useMemo(() => {
    // const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    // 현재 프론트(origin)에 맞는 콜백 URL 생성
    // const returnTo = `${window.location.origin}${base}${PATH.OAUTH_REGISTER}`;

    const url = new URL(`${AUTH_SERVER_ORIGIN}/oauth2/authorization/kakao`);
    // url.searchParams.set("return_to", returnTo);

    return url.toString();
  }, []);

  const handleClick = () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } catch {
      //
    }
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
