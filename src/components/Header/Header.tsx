import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUserGroup } from "react-icons/fa6";
import { BsFillBellFill } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { MdSearch } from "react-icons/md";
import { useSearchStore } from "@/store/useSearchStore";
import useClickOutside from "@/hooks/useClickOutside";
import UserMenuDropdown from "../Menu/UserMenuDropdown";
import NotificationModal from "../Modal/NotificationModal";
import { PATH } from "@/constants/paths";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const { placeholder, setPlaceholder } = useSearchStore();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const userDropdownRef = useClickOutside(() => setIsUserDropdownOpen(false));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const myUserId = "123"; // 실제 로그인한 사용자 ID로 대체 필요

  useEffect(() => {
    const path = location.pathname;

    const mypageMatch = path.match(/^\/user\/mypage\/([^/]+)/);
    const pageUserId = mypageMatch?.[1];

    if (path.startsWith(PATH.MYPAGE(""))) {
      if (pageUserId === myUserId) {
        setPlaceholder(
          "키워드나 태그 등의 검색어를 통해 내 트러블슈팅을 검색해보세요!"
        );
      } else {
        setPlaceholder(
          `키워드나 태그 등의 검색어를 통해 ${pageUserId}님의 트러블슈팅을 검색해보세요!`
        );
      }
    } else if (path.startsWith(PATH.HOME)) {
      setPlaceholder(
        "키워드나 태그 등의 검색어를 통해 내 트러블슈팅을 검색해보세요!"
      );
    } else {
      setPlaceholder(
        "키워드나 태그 등의 검색어를 통해 다른 사람들의 트러블슈팅을 검색해보세요!"
      );
    }
  }, [location.pathname, setPlaceholder, myUserId]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSubmitSearch = () => {
    if (!search.trim()) return;

    const currentPath = location.pathname;
    let scope = "community";
    let pageUserId = "";

    const mypageMatch = currentPath.match(/^\/user\/mypage\/([^/]+)/);
    pageUserId = mypageMatch?.[1] ?? "";

    if (currentPath.startsWith(PATH.MYPAGE(""))) {
      scope = pageUserId === myUserId ? "mypage" : "user";
    } else if (currentPath.startsWith(PATH.HOME)) {
      scope = "my";
    }

    const searchParams = new URLSearchParams();
    searchParams.set("query", search);
    searchParams.set("scope", scope);
    if (scope === "user") searchParams.set("userId", pageUserId);

    navigate(`${PATH.SEARCH}?${searchParams.toString()}`);
  };

  return (
    <div className="flex w-full py-[25px] px-[88px] gap-[10px] justify-between items-center shadow-[0_0_6px_0_rgba(0,0,0,0.12)]">
      <img
        src="/icons/logo.svg"
        alt="logo"
        className="w-[70px] h-[51px] cursor-pointer"
        onClick={() => navigate(PATH.HOME)}
      />
      <div className="flex gap-[72px] items-center">
        <div className="flex w-[1200px] h-12 p-2 justify-between items-center gap-1 rounded-md border border-gray1">
          <input
            className="text-body-14-regular w-full"
            placeholder={placeholder}
            value={search}
            onChange={handleSearch}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitSearch()}
          />
          <MdSearch
            size={24}
            onClick={handleSubmitSearch}
            className="cursor-pointer"
          />
        </div>
        <div className="flex gap-10 items-center relative">
          <FaUserGroup size={40} color="#525252" />
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
    </div>
  );
};

export default Header;
