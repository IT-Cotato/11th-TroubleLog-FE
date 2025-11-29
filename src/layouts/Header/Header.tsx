import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
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

const MIN_QUERY_LEN = 2;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const { placeholder, setPlaceholder } = useSearchStore();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isCommunityTipOpen, setIsCommunityTipOpen] = useState(false);
  const communityTipTimer = useRef<NodeJS.Timeout | null>(null);
  const userDropdownRef = useClickOutside(() => setIsUserDropdownOpen(false));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const viewerId = useViewerId();
  const myUserIdStr = viewerId != null ? String(viewerId) : null;
  const viewedUser = useMyPageStore((s) => s.viewedUser);

  const [searchParams] = useSearchParams();
  const hasNew = useNotificationStore((s) => s.hasNew);
  const clearNew = useNotificationStore((s) => s.clearNew);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 공용 알림 함수 (토스트 우선, 안 되면 alert)
  const notify = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastOpen(false), 1600);
  };

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // ?openNotif=1 오면 모달 오픈 + 파라미터 제거
  useEffect(() => {
    if (searchParams.get("openNotif") === "1") {
      setIsNotificationModalOpen(true);
      if (hasNew) clearNew();

      const sp = new URLSearchParams(location.search);
      sp.delete("openNotif");
      navigate(
        { pathname: location.pathname, search: sp.toString() },
        { replace: true }
      );
    }
  }, [
    searchParams,
    hasNew,
    clearNew,
    navigate,
    location.pathname,
    location.search,
  ]);

  const openCommunityTip = () => {
    if (communityTipTimer.current) clearTimeout(communityTipTimer.current);
    setIsCommunityTipOpen(true);
  };
  const scheduleCloseCommunityTip = () => {
    communityTipTimer.current = setTimeout(
      () => setIsCommunityTipOpen(false),
      180
    );
  };
  const closeCommunityTipImmediately = () => {
    if (communityTipTimer.current) clearTimeout(communityTipTimer.current);
    setIsCommunityTipOpen(false);
  };

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

    // 마이페이지 경로 처리
    if (path.startsWith(PATH.MYPAGE_BASE)) {
      const segments = path.split("/").filter(Boolean);
      const third = segments[2];

      // 내 닉네임 (viewedUser가 나 자신일 때)
      const myDisplayName =
        viewerId != null &&
        viewedUser?.id === Number(viewerId) &&
        viewedUser?.nickname
          ? viewedUser.nickname
          : null;

      // 1) 내 마이페이지
      if (
        !third ||
        third === "statistics" ||
        third === "troubles" ||
        third === "likes" ||
        third === "editprofile"
      ) {
        if (myDisplayName) {
          setPlaceholder(
            `키워드나 태그 등의 검색어를 통해 ${myDisplayName}님의 트러블슈팅을 검색해보세요!`
          );
        } else {
          setPlaceholder(
            "키워드나 태그 등의 검색어를 통해 내 트러블슈팅을 검색해보세요!"
          );
        }
        return;
      }

      // 2) 다른 사용자의 마이페이지
      if (/^\d+$/.test(third)) {
        const pageUserId = third;
        const displayName =
          viewedUser?.id === Number(pageUserId) && viewedUser?.nickname
            ? viewedUser.nickname
            : pageUserId;

        setPlaceholder(
          `키워드나 태그 등의 검색어를 통해 ${displayName}님의 트러블슈팅을 검색해보세요!`
        );
        return;
      }

      // 3) 그 외 예외적인 경로는 일단 "다른 사람들"로 처리
      setPlaceholder(
        "키워드나 태그 등의 검색어를 통해 다른 사람들의 트러블슈팅을 검색해보세요!"
      );
      return;
    }

    // 홈 / 프로젝트 상세 → '내 트러블슈팅' 위주
    if (
      path.startsWith(PATH.HOME) ||
      path.startsWith(PATH.PROJECT_DETAIL(""))
    ) {
      setPlaceholder(
        "키워드나 태그 등의 검색어를 통해 내 트러블슈팅을 검색해보세요!"
      );
    } else {
      // 그 외 페이지: 커뮤니티 등
      setPlaceholder(
        "키워드나 태그 등의 검색어를 통해 다른 사람들의 트러블슈팅을 검색해보세요!"
      );
    }
  }, [
    location.pathname,
    location.search,
    setPlaceholder,
    viewerId,
    viewedUser?.id,
    viewedUser?.nickname,
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value);

  const handleSubmitSearch = () => {
    const q = search.trim();
    if (q.length < MIN_QUERY_LEN) {
      notify(`검색어는 최소 ${MIN_QUERY_LEN}자 이상 입력해주세요.`);
      inputRef.current?.focus();
      return;
    }

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
      if (currentPath === PATH.MYPAGE_BASE) {
        scope = "mypage";
      } else if (currentPath.startsWith(PATH.MYPAGE_BASE + "/")) {
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
    <div className="flex w-full py-4 px-4 sm:px-6 lg:px-[88px] gap-4 sm:gap-8 lg:gap-12 justify-between items-center shadow-[0_0_6px_0_rgba(0,0,0,0.12)]">
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
            className="text-body-14-regular sm:text-body-16-regular w-full h-full focus:outline-none placeholder-sm placeholder-tight"
            placeholder={placeholder}
            value={search}
            onChange={handleSearch}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitSearch()}
          />
          <MdSearch
            onClick={handleSubmitSearch}
            className="cursor-pointer text-[20px] sm:text-[24px]"
            aria-label="검색"
          />
        </div>

        {/* Icons */}
        <div className="flex gap-4 sm:gap-6 lg:gap-10 items-center relative">
          {/* Community */}
          <div
            className="relative"
            onMouseEnter={openCommunityTip}
            onMouseLeave={scheduleCloseCommunityTip}
            onFocus={openCommunityTip}
            onBlur={closeCommunityTipImmediately}
          >
            <FaUserGroup
              className="cursor-pointer text-[#525252] text-[28px] sm:text-[32px] lg:text-[40px] 
             transition-colors hover:text-primary
             focus:outline-none focus:ring-0 focus-visible:outline-none"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => navigate(PATH.COMMUNITY)}
              aria-label="커뮤니티로 이동"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(PATH.COMMUNITY);
                }
              }}
              onMouseEnter={openCommunityTip}
              onMouseLeave={scheduleCloseCommunityTip}
            />

            {/* Guide Tooltip */}
            {isCommunityTipOpen && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20
                           rounded-md bg-gray-900 text-white px-3 py-1
                           text-[12px] sm:text-[13px] shadow-lg whitespace-nowrap
                           animate-in fade-in zoom-in-95"
                role="tooltip"
              >
                커뮤니티로 이동
                {/* 꼬리(삼각형) */}
                <span
                  className="absolute -top-1 left-1/2 -translate-x-1/2
                             w-2 h-2 rotate-45 bg-gray-900"
                  aria-hidden
                />
              </div>
            )}
          </div>
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

      {/* Toast */}
      <div
        aria-live="assertive"
        className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-[1000] transition-all duration-200
              ${
                toastOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 pointer-events-none"
              }`}
      >
        <div className="rounded-md bg-gray-900/90 text-white px-4 py-2 text-sm shadow-lg">
          {toastMsg}
        </div>
      </div>
    </div>
  );
};

export default Header;
