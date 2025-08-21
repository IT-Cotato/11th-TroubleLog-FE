import kakaoLogoIcon from "@/assets/icons/kakaologo.svg";
import { KAKAO_REDIRECT_URI } from "../../config";
import { useNavigate } from "react-router-dom";

const KakaoLoginButton = () => {
  const redirectUri = KAKAO_REDIRECT_URI; // 재현님 만드신 링크
  const navigate = useNavigate();

  const handleClick = () => navigate(redirectUri);

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
};

export default KakaoLoginButton;
