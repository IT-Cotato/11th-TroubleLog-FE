import MyPageSideBar from "@/components/MyPage/MyPageSidebar";
import { Outlet } from "react-router-dom";
import { useParams } from "react-router-dom";
import { mockCards } from "@/mocks/mockCards";

const MyPageLayout = () => {
  const { id } = useParams<{ id: string }>();
  const myUserId = "123";
  const isMyPage = id === myUserId;

  // 사용자의 카드만 필터링 (임시)
  const myCards = mockCards.filter((card) => card.isMine);

  // 작성 상태별 트러블슈팅 개수 계산
  const counts = {
    all: myCards.length,
    inProgress: myCards.filter((c) => c.status === "inProgress").length,
    complete: myCards.filter((c) => c.status === "complete").length,
    created: myCards.filter((c) => c.status === "created").length,
  };

  return (
    <div className="flex items-start gap-[68px] pt-20 justify-center">
      <MyPageSideBar isMyPage={isMyPage} counts={counts} />

      <div className="flex flex-col items-start">
        <Outlet context={{ isMyPage }} />
      </div>
    </div>
  );
};

export default MyPageLayout;
