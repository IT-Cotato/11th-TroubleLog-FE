import { FaUserGroup } from "react-icons/fa6";
import { BsFillBellFill } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/icons/logo.svg";
import { PATH } from "@/shared/config/paths";
import { useEffect, useRef, useState, useCallback } from "react";
import useClickOutside from "@/hooks/useClickOutside";
import NotificationModal from "../../shared/ui/Modal/NotificationModal";
import UserMenuDropdown from "../../shared/ui/Menu/UserMenuDropdown";
import { useViewerId } from "@/store/auth";
import { useNotificationStore } from "@/store/notification";

const HeaderWoSearch = () => {
  const navigate = useNavigate();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const closeUserDropdown = useCallback(() => setIsUserDropdownOpen(false), []);
  const userDropdownRef = useClickOutside(closeUserDropdown);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 로그인 사용자 ID
  const viewerId = useViewerId();
  const myUserIdStr = viewerId != null ? String(viewerId) : null;

  const hasNew = useNotificationStore((s) => s.hasNew);
  const clearNew = useNotificationStore((s) => s.clearNew);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsNotificationModalOpen(true);
    if (hasNew) clearNew();
  }, [hasNew, clearNew]);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(
      () => setIsNotificationModalOpen(false),
      200
    );
  }, []);

  // 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="flex w-full py-4 px-4 sm:px-6 lg:px-[88px] gap-4 sm:gap-8 lg:gap-12 justify-between items-center shadow-[0_0_6px_0_rgba(0,0,0,0.12)]">
      <img
        src={logo}
        alt="logo"
        className="w-[56px] h-[40px] sm:w-[70px] sm:h-[51px] cursor-pointer"
        onClick={() => navigate(PATH.HOME)}
      />

      {/* Icons */}
      <div className="flex gap-4 sm:gap-6 lg:gap-10 items-center relative">
        <FaUserGroup
          className="cursor-pointer text-[#525252] text-[28px] sm:text-[32px] lg:text-[40px]"
          onClick={() => navigate(PATH.COMMUNITY)}
        />

        {/* 알림 (hover 시 열림) */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <BsFillBellFill
            className="cursor-pointer transition-colors text-[28px] sm:text-[32px] lg:text-[40px]"
            color={hasNew ? "#7C3AED" : "#525252"}
          />
          {isNotificationModalOpen && (
            <div className="absolute right-0 top-full mt-3 sm:mt-[41.5px] z-10">
              <NotificationModal />
            </div>
          )}
        </div>

        {/* 유저 메뉴 */}
        <div ref={userDropdownRef} className="relative">
          <FaUserCircle
            className="cursor-pointer text-[#525252] text-[28px] sm:text-[32px] lg:text-[40px]"
            onClick={() => setIsUserDropdownOpen((prev) => !prev)}
          />
          {isUserDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 z-10">
              <UserMenuDropdown
                onClose={() => setIsUserDropdownOpen(false)}
                onNavigateToMyPage={() => {
                  if (myUserIdStr) navigate(PATH.MYPAGE_BASE);
                  else navigate(PATH.ROOT);
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
