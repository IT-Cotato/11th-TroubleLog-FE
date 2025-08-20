import kakaoLogoIcon from "@/assets/icons/kakaologo.svg";
import { useNavigate } from "react-router-dom";
import { PATH } from "@/constants/paths";
import { openOAuthPopup } from "@/utils/openOAuthPopup";
import { applyAuth } from "@/utils/applyAuth";

const API_BASE = "https://troublog.shop".replace(/\/+$/, "");
const FRONT_CALLBACK = `${window.location.origin}/oauth/popup/kakao`;
const AUTH_START_URL = `${API_BASE}/oauth2/authorization/kakao?return_to=${encodeURIComponent(
  FRONT_CALLBACK
)}`;

export default function KakaoLoginButton() {
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      const payload = await openOAuthPopup(
        AUTH_START_URL,
        window.location.origin
      );
      // 서버 약속:
      // - 추가가입 필요: userId, nickname, loginType, userStatus
      // - 이미 가입:     userId, accessToken (refreshToken은 Set-Cookie)

      if (payload?.accessToken) {
        // 이미 가입 → 바로 로그인 상태
        applyAuth(payload.accessToken);
        navigate(PATH.HOME, { replace: true });
        return;
      }

      if (payload?.userStatus === "INCOMPLETE" && payload?.userId) {
        navigate(PATH.SIGNUP_OAUTH, {
          replace: true,
          state: { userId: payload.userId, nickname: payload.nickname ?? "" },
        });
        return;
      }

      // 예외 처리: 기대값이 없으면 로그인 화면 유지/에러 토스트 등
      console.warn("Unexpected OAuth payload:", payload);
    } catch (e) {
      console.error(e);
      // 팝업 차단/취소 등 처리
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center gap-2 py-3 px-[208px] rounded-lg bg-[#FEE500] w-full"
    >
      <img src={kakaoLogoIcon} className="w-[18px] h-[18px]" alt="kakao" />
      <span className="text-[20px] font-semibold leading-normal text-[rgba(0,0,0,0.85)] font-pretendard">
        카카오 로그인
      </span>
    </button>
  );
}
