import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUserGroup } from "react-icons/fa6";
import { BsFillBellFill } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { MdSearch } from "react-icons/md";
import { useSearchStore } from "@/store/useSearchStore";
import useClickOutside from "@/hooks/useClickOutside";
import UserMenuDropdown from "../../shared/ui/Menu/UserMenuDropdown";
import NotificationModal from "../../shared/ui/Modal/NotificationModal";
import { PATH } from "@/shared/config/paths";
import logo from "@/assets/icons/logo.svg";
import { useViewerId } from "@/store/auth";
import { useNotificationStore } from "@/store/notification";
import { useMyPageStore } from "@/store/useMyPageStore";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const { placeholder, setPlaceholder } = useSearchStore();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const userDropdownRef = useClickOutside(() => setIsUserDropdownOpen(false));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const viewerId = useViewerId();
  const myUserIdStr = viewerId != null ? String(viewerId) : null;
  const viewedUser = useMyPageStore((s) => s.viewedUser);

  const hasNew = useNotificationStore((s) => s.hasNew);
  const clearNew = useNotificationStore((s) => s.clearNew);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsNotificationModalOpen(true);
    if (hasNew) clearNew();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(
      () => setIsNotificationModalOpen(false),
      200
    );
  };

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith(PATH.SEARCH)) {
      const sp = new URLSearchParams(location.search);
      const scope = sp.get("scope");
      const pageUserId = sp.get("userId") ?? "";
      if (scope === "my" || scope === "mypage") {
        setPlaceholder(
          "키워드나 태그 등의 검색어를 통해 내 트러블슈팅을 검색해보세요!"
        );
      } else if (scope === "user" && pageUserId) {
        const displayName =
          viewedUser?.id === Number(pageUserId) && viewedUser?.nickname
            ? viewedUser.nickname
            : pageUserId;
        setPlaceholder(
          `키워드나 태그 등의 검색어를 통해 ${displayName}님의 트러블슈팅을 검색해보세요!`
        );
      } else {
        setPlaceholder(
          "키워드나 태그 등의 검색어를 통해 다른 사람들의 트러블슈팅을 검색해보세요!"
        );
      }
      return;
    }

    const mypageMatch = path.match(/^\/user\/mypage\/([^/]+)/);
    const pageUserId = mypageMatch?.[1];

    if (path.startsWith(PATH.MYPAGE(""))) {
      if (pageUserId && myUserIdStr && pageUserId === myUserIdStr) {
        setPlaceholder(
          "키워드나 태그 등의 검색어를 통해 내 트러블슈팅을 검색해보세요!"
        );
      } else {
        const displayName =
          viewedUser?.id === Number(pageUserId) && viewedUser?.nickname
            ? viewedUser.nickname
            : pageUserId ?? "사용자";
        setPlaceholder(
          `키워드나 태그 등의 검색어를 통해 ${displayName}님의 트러블슈팅을 검색해보세요!`
        );
      }
    } else if (
      path.startsWith(PATH.HOME) ||
      path.startsWith(PATH.PROJECT_DETAIL(""))
    ) {
      setPlaceholder(
        "키워드나 태그 등의 검색어를 통해 내 트러블슈팅을 검색해보세요!"
      );
    } else {
      setPlaceholder(
        "키워드나 태그 등의 검색어를 통해 다른 사람들의 트러블슈팅을 검색해보세요!"
      );
    }
  }, [
    location.pathname,
    setPlaceholder,
    myUserIdStr,
    location.search,
    viewedUser?.id,
    viewedUser?.nickname,
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value);

  const handleSubmitSearch = () => {
    if (!search.trim()) return;
    const currentPath = location.pathname;
    const existing = new URLSearchParams(location.search);
    const rawScope = existing.get("scope");
    let scope: "my" | "mypage" | "user" | "community" | "project" | null =
      rawScope === "my" ||
      rawScope === "mypage" ||
      rawScope === "user" ||
      rawScope === "community" ||
      rawScope === "project"
        ? rawScope
        : null;
    let pageUserId = existing.get("userId") ?? "";

    if (!scope) {
      scope = "community";
      const mypageMatch = currentPath.match(/^\/user\/mypage\/([^/]+)/);
      pageUserId = mypageMatch?.[1] ?? "";
      if (currentPath.startsWith(PATH.MYPAGE(""))) {
        scope = pageUserId === myUserIdStr ? "mypage" : "user";
      } else if (
        currentPath.startsWith(PATH.HOME) ||
        currentPath.startsWith(PATH.PROJECT_DETAIL(""))
      ) {
        scope = "my";
      }
    }

    const searchParams = new URLSearchParams();
    searchParams.set("query", search);
    searchParams.set("scope", scope);
    if (scope === "user" && pageUserId) searchParams.set("userId", pageUserId);
    searchParams.set("page", "1");
    searchParams.set("size", "10");

    navigate(`${PATH.SEARCH}?${searchParams.toString()}`);
  };

  useEffect(() => {
    if (location.pathname.startsWith(PATH.SEARCH)) {
      const sp = new URLSearchParams(location.search);
      setSearch(sp.get("query") ?? "");
    } else {
      setSearch("");
    }
  }, [location.pathname, location.search]);

  return (
    <div className="flex w-full py-4 sm:py-5 lg:py-[25px] px-4 sm:px-6 lg:px-[88px] gap-4 sm:gap-8 lg:gap-12 justify-between items-center shadow-[0_0_6px_0_rgba(0,0,0,0.12)]">
      <img
        src={logo}
        alt="logo"
        className="w-[56px] h-[40px] sm:w-[70px] sm:h-[51px] cursor-pointer"
        onClick={() => navigate(PATH.HOME)}
      />
      <div className="flex w-full gap-4 sm:gap-8 items-center">
        {/* Search */}
        <div
          role="search"
          onClick={() => inputRef.current?.focus()}
          className="group flex w-full h-10 sm:h-12 p-2 justify-between items-center gap-1 rounded-md border border-gray1 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40"
        >
          <input
            ref={inputRef}
            className="text-body-14-regular sm:text-body-16-regular w-full h-full focus:outline-none
                      placeholder-sm placeholder-tight"
            placeholder={placeholder}
            value={search}
            onChange={handleSearch}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitSearch()}
          />
          <MdSearch
            onClick={handleSubmitSearch}
            className="cursor-pointer text-[20px] sm:text-[24px]"
          />
        </div>

        {/* Icons */}
        <div className="flex gap-4 sm:gap-6 lg:gap-10 items-center relative">
          <FaUserGroup
            className="cursor-pointer text-[#525252] text-[28px] sm:text-[32px] lg:text-[40px]"
            onClick={() => navigate(PATH.COMMUNITY)}
          />
          {/* Notifications */}
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
          {/* User */}
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
                    if (myUserIdStr) navigate(PATH.MYPAGE(myUserIdStr));
                    else navigate(PATH.ROOT);
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
