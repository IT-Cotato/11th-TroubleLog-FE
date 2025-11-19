import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { handleLoginSuccess } from "@/utils/handleLoginSuccess";
import { PATH } from "@/shared/config/paths";

const UserHomeCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("accessToken");
    const userIdStr = params.get("userId");

    if (accessToken && userIdStr) {
      const userId = Number(userIdStr);
      handleLoginSuccess({ userId, accessToken });

      // URL 깔끔하게 정리 (쿼리 제거)
      navigate(PATH.HOME, { replace: true });
    } else {
      // 토큰/유저 정보 없으면 그냥 로그인 화면으로
      navigate(PATH.LOGIN, { replace: true });
    }
  }, [location.search, navigate]);

  // 간단한 로딩 화면
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <p className="text-gray-600">카카오 로그인 처리 중...</p>
    </div>
  );
};

export default UserHomeCallback;
