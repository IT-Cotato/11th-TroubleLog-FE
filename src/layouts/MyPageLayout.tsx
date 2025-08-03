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

  // 태그 정렬 / 태그별 개수 계산 (다른 사용자의 페이지)
  const publicCards = mockCards.filter((card) => !card.isMine);
  const tagCounts: Record<string, number> = {};
  publicCards
    .flatMap((card) => card.tags)
    .forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex items-start gap-[68px] pt-20 justify-center">
      <MyPageSideBar
        {...(isMyPage
          ? { isMyPage: true as const, counts }
          : { isMyPage: false as const, sortedTags })}
      />

      <div className="flex flex-col items-start">
        <Outlet context={{ isMyPage }} />
      </div>
    </div>
  );
};

export default MyPageLayout;
