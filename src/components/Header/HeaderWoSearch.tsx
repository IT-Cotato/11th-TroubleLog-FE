import { FaUserGroup } from "react-icons/fa6";
import { BsFillBellFill } from "react-icons/bs";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/icons/logo.svg";
import { PATH } from "@/constants/paths";

const HeaderWoSearch = () => {
  const navigate = useNavigate();

  return (
    <div className="flex w-full py-[25px] px-[88px] gap-[10px] justify-between items-center shadow-[0_0_6px_0_rgba(0,0,0,0.12)]">
      <img
        src={logo}
        alt="logo"
        className="w-[70px] h-[51px]"
        onClick={() => navigate("home")}
      />
      <div className="flex gap-10 items-center">
        <FaUserGroup
          size={40}
          color="#525252 cursor-pointer"
          onClick={() => navigate(PATH.COMMUNITY)}
        />
        <BsFillBellFill size={40} color="#525252" />
        <FaUserCircle size={40} color="#525252" />
      </div>
    </div>
  );
};

export default HeaderWoSearch;
