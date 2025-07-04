import { FaUserGroup } from "react-icons/fa6";
import { BsFillBellFill } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { MdSearch } from "react-icons/md";

const Header = () => {
  return (
    <div className="flex w-full py-[25px] px-[88px] gap-[10px] justify-between items-center shadow-[0_0_6px_0_rgba(0,0,0,0.12)]">
      <img src="/icons/logo.svg" alt="logo" className="w-[70px] h-[51px]" />
      <div className="flex gap-[72px] items-center">
        <div className="flex w-[1200px] h-12 p-2 justify-between items-center gap-1 rounded-md border border-gray1">
          <input
            className="text-body-14-regular w-full"
            placeholder="키워드나 태그 등의 검색어를 통해 내 트러블슈팅을 검색해보세요!"
          />
          <MdSearch size={24} />
        </div>
        <div className="flex gap-10 items-center">
          <FaUserGroup size={40} color="#525252" />
          <BsFillBellFill size={40} color="#525252" />
          <FaUserCircle size={40} color="#525252" />
        </div>
      </div>
    </div>
  );
};

export default Header;
