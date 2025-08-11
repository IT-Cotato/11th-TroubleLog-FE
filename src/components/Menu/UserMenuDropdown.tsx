import { useNavigate } from "react-router-dom";
import { postLogout } from "@/api/auth.api";

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
      const response = await postLogout();
      console.log("로그아웃 성공:", response.data);

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken"); // 저장되어있으면

      onClose();
      navigate("/login");
    } catch (error: any) {
      console.error("로그아웃 실패:", error);
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
