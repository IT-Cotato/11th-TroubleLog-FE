import kakaoLogoIcon from "@/assets/icons/kakaologo.svg";
import { useNavigate } from "react-router-dom";
import { PATH } from "@/constants/paths";
import { openOAuthPopup } from "@/utils/openOAuthPopup";
import { applyAuth } from "@/utils/applyAuth";

const FRONT_CALLBACK = `${window.location.origin}${PATH.OAUTH_REGISTER}`; // 👉 /auth/oauth-register
const AUTH_START_URL = `https://troublog.shop/oauth2/authorization/kakao?return_to=${encodeURIComponent(
  FRONT_CALLBACK
)}`;

export default function KakaoLoginButton() {
  const navigate = useNavigate();

  const handleClick = async () => {
    console.debug("[KakaoLoginButton] FRONT_CALLBACK:", FRONT_CALLBACK);
    console.debug("[KakaoLoginButton] AUTH_START_URL:", AUTH_START_URL);

    try {
      const p = await openOAuthPopup(AUTH_START_URL, window.location.origin);
      console.debug("[KakaoLoginButton] payload:", p);

      if (p?.accessToken) {
        applyAuth(p.accessToken);
        navigate(PATH.HOME, { replace: true });
        return;
      }
      const status = p?.userStatus ?? p?.status;
      if (status === "INCOMPLETE" && p?.userId) {
        navigate(PATH.SIGNUP_OAUTH, {
          replace: true,
          state: { userId: p.userId, nickname: p.nickname ?? "" },
        });
        return;
      }
      console.warn("[KakaoLoginButton] Unexpected payload:", p);
    } catch (e) {
      console.error("[KakaoLoginButton] popup failed:", e);
    }
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
