import { FaUserGroup } from "react-icons/fa6";
import { BsFillBellFill } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/icons/logo.svg";
import { PATH } from "@/constants/paths";
import { useRef, useState } from "react";
import useClickOutside from "@/hooks/useClickOutside";
import NotificationModal from "../Modal/NotificationModal";
import UserMenuDropdown from "../Menu/UserMenuDropdown";

const HeaderWoSearch = () => {
  const navigate = useNavigate();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const userDropdownRef = useClickOutside(() => setIsUserDropdownOpen(false));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const myUserId = localStorage.getItem("userId") || "";

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsNotificationModalOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsNotificationModalOpen(false);
    }, 200);
  };

  return (
    <div className="flex w-full py-[25px] px-[88px] gap-[10px] justify-between items-center shadow-[0_0_6px_0_rgba(0,0,0,0.12)]">
      <img
        src={logo}
        alt="logo"
        className="w-[70px] h-[51px] cursor-pointer"
        onClick={() => navigate(PATH.HOME)}
      />
      <div className="flex gap-10 items-center relative">
        <FaUserGroup
          size={40}
          color="#525252"
          className="cursor-pointer"
          onClick={() => navigate(PATH.COMMUNITY)}
        />
        {/* 알림 영역 (hover 시 열림 + 벗어나면 닫힘) */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <BsFillBellFill
            size={40}
            color="#525252"
            className="cursor-pointer"
          />
          {isNotificationModalOpen && (
            <div className="absolute right-[-10px] top-full mt-[41.5px] z-10">
              <NotificationModal />
            </div>
          )}
        </div>
        <div ref={userDropdownRef}>
          <FaUserCircle
            size={40}
            color="#525252"
            className="cursor-pointer"
            onClick={() => setIsUserDropdownOpen((prev) => !prev)}
          />
          {isUserDropdownOpen && (
            <div className="absolute left-1/3 top-full mt-2 z-10">
              <UserMenuDropdown
                onClose={() => setIsUserDropdownOpen(false)}
                onNavigateToMyPage={() => {
                  navigate(PATH.MYPAGE(myUserId));
                  setIsUserDropdownOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderWoSearch;
