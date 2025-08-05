import instance from "../../api/axios";
import { useNavigate } from "react-router-dom";

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
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        console.warn("No refresh token found.");
        return;
      }

      const response = await instance.post(
        "/auth/logout",
        {},
        {
          headers: {
            refreshToken: refreshToken,
          },
        }
      );

      console.log("로그아웃 성공", response.data);

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
        onClick={() => {
          handleLogout();
          console.log("로그아웃 처리");
          onClose();
        }}
      >
        로그아웃
      </div>
    </div>
  );
}
