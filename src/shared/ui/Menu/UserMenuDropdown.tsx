import { useNavigate } from "react-router-dom";
import { postLogout } from "@/api/auth.api";
import { PATH } from "@/shared/config/paths";
import { devLog } from "@/shared/utils/logger";
interface UserMenuDropdownProps {
  onNavigateToMyPage: () => void;
  onClose: () => void;
}

export default function UserMenuDropdown({
  onNavigateToMyPage,
  onClose,
}: UserMenuDropdownProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await postLogout();
    } catch (error) {
      devLog.error("로그아웃 실패:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      onClose();
      navigate(PATH.LOGIN);
    }
  };

  return (
    <div className="min-w-[160px] py-2 bg-white border border-gray2 rounded-md shadow-md">
      <div
        className="px-4 py-2 cursor-pointer hover:bg-gray1"
        onClick={onNavigateToMyPage}
      >
        마이페이지
      </div>
      <div
        className="px-4 py-2 cursor-pointer hover:bg-gray1"
        onClick={handleLogout}
      >
        로그아웃
      </div>
    </div>
  );
}
