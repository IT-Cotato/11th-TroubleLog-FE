import MyPageSideBar from "@/components/MyPage/MyPageSidebar";
import { Outlet } from "react-router-dom";

const MyPageLayout = () => {
  return (
    <div className="flex items-start gap-[68px] pt-20">
      <MyPageSideBar />
      <div className="flex flex-col items-start">
        <Outlet />
      </div>
    </div>
  );
};

export default MyPageLayout;
