import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUserGroup } from "react-icons/fa6";
import { BsFillBellFill } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { MdSearch } from "react-icons/md";
import { useSearchStore } from "@/store/useSearchStore";
import useClickOutside from "@/hooks/useClickOutside";
import UserMenuDropdown from "../Menu/UserMenuDropdown";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const { placeholder, setPlaceholder } = useSearchStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useClickOutside(() => setIsDropdownOpen(false));

  const myUserId = "123"; // 실제 로그인한 사용자 ID로 대체 필요

  useEffect(() => {
    const path = location.pathname;

    if (path.startsWith("/user/profile/")) {
      const username = path.split("/user/profile/")[1]?.split("/")[0];
      setPlaceholder(
        `키워드나 태그 등의 검색어를 통해 ${username}님의 트러블슈팅을 검색해보세요!`
      );
    } else if (
      path.startsWith("/user/mypage") ||
      path.startsWith("/user/home")
    ) {
      setPlaceholder(
        "키워드나 태그 등의 검색어를 통해 내 트러블슈팅을 검색해보세요!"
      );
    } else {
      setPlaceholder(
        "키워드나 태그 등의 검색어를 통해 다른 사람들의 트러블슈팅을 검색해보세요!"
      );
    }
  }, [location.pathname, setPlaceholder]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSubmitSearch = () => {
    if (!search.trim()) return;

    const currentPath = location.pathname;
    let scope = "community";
    let username = "";

    if (currentPath.startsWith("/user/profile/")) {
      scope = "user";
      username = currentPath.split("/user/profile/")[1]?.split("/")[0];
    } else if (currentPath === "/user/mypage") {
      scope = "mypage";
    } else if (currentPath.startsWith("/user/home")) {
      scope = "my";
    }

    const searchParams = new URLSearchParams();
    searchParams.set("query", search);
    searchParams.set("scope", scope);
    if (username) searchParams.set("username", username);

    navigate(`/user/search?${searchParams.toString()}`);
  };

  return (
    <div className="flex w-full py-[25px] px-[88px] gap-[10px] justify-between items-center shadow-[0_0_6px_0_rgba(0,0,0,0.12)]">
      <img
        src="/icons/logo.svg"
        alt="logo"
        className="w-[70px] h-[51px] cursor-pointer"
        onClick={() => navigate("/user/home")}
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
        <div className="flex gap-10 items-center relative" ref={dropdownRef}>
          <FaUserGroup size={40} color="#525252" />
          <BsFillBellFill size={40} color="#525252" />
          <FaUserCircle
            size={40}
            color="#525252"
            className="cursor-pointer"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          />
          {isDropdownOpen && (
            <div className="absolute left-1/3 top-full mt-2 z-10">
              <UserMenuDropdown
                onClose={() => setIsDropdownOpen(false)}
                onNavigateToMyPage={() => {
                  navigate(`/user/mypage/${myUserId}`);
                  setIsDropdownOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
