import MyPageSideBar from "@/components/MyPage/MyPageSidebar";
import { Outlet } from "react-router-dom";
import { useParams } from "react-router-dom";

const MyPageLayout = () => {
  const { id } = useParams();
  const myUserId = "123";
  const isMyPage = id === myUserId;

  return (
    <div className="flex items-start gap-[68px] pt-20">
      <MyPageSideBar isMyPage={isMyPage} />
      <div className="flex flex-col items-start">
        <Outlet />
      </div>
    </div>
  );
};

export default MyPageLayout;
