import { Outlet } from "react-router-dom";

const MyPageLayout = () => {
  return (
    <div className="flex items-start gap-[68px]">
      <div className="flex w-[296px] flex-col items-start gap-[142px]">
        왼쪽 고정 컴포넌트 넣기
      </div>
      <div className="flex w-[948px] flex-col items-start">
        <Outlet />
      </div>
    </div>
  );
};

export default MyPageLayout;
