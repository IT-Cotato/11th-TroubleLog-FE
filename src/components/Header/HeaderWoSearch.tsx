import { FaUserGroup } from "react-icons/fa6";
import { BsFillBellFill } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/icons/logo.svg";
import { PATH } from "@/constants/paths";
import { useEffect, useRef, useState } from "react";
import useClickOutside from "@/hooks/useClickOutside";
import NotificationModal from "../Modal/NotificationModal";
import UserMenuDropdown from "../Menu/UserMenuDropdown";
import { useViewerId } from "@/store/auth";
import { useNotificationStore } from "@/store/notification";

const HeaderWoSearch = () => {
  const navigate = useNavigate();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const userDropdownRef = useClickOutside(() => setIsUserDropdownOpen(false));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 중앙 상태에서 로그인 사용자 ID 읽기 (null | number)
  const viewerId = useViewerId();
  const myUserId = viewerId != null ? String(viewerId) : null;

  const { hasNew, clearNew } = useNotificationStore((s) => ({
    hasNew: s.hasNew,
    clearNew: s.clearNew,
  }));

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsNotificationModalOpen(true);
    clearNew();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsNotificationModalOpen(false);
    }, 200);
  };

  // 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
            color={hasNew ? "#7C3AED" : "#525252"}
            className="cursor-pointer transition-colors"
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
                  navigate(PATH.MYPAGE(String(myUserId)));
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
