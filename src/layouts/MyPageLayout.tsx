import MyPageSideBar from "@/components/MyPage/MyPageSidebar";
import { Outlet } from "react-router-dom";
import { useParams } from "react-router-dom";
import useTroubleCards from "@/hooks/useTroubleCards";
import { useMemo, useState } from "react";

const MyPageLayout = () => {
  const { id } = useParams<{ id: string }>();
  const myUserId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const isMyPage = !!myUserId && id === myUserId;

  // 정렬 상태
  const [sortBy, setSortBy] = useState<"latest" | "likes">("latest");

  // 사용자의 트러블슈팅 목록 불러오기
  const { cards, isLoading, error, hasNext, sentinelRef, reload } =
    useTroubleCards({ type: "all" }, { infinite: true, pageSize: 10, sortBy });

  // 작성 상태별 트러블슈팅 개수 계산
  const counts = useMemo(() => {
    const mine = cards.filter((c) => c.isMine);
    return {
      all: mine.length,
      inProgress: mine.filter((c) => c.status === "inProgress").length,
      complete: mine.filter((c) => c.status === "complete").length,
      created: mine.filter((c) => c.status === "created").length,
    };
  }, [cards]);

  // 다른 사용자의 마이페이지용 태그 분석 (임시)
  const sortedTags: [string, number][] = [];

  return (
    <div className="flex items-start gap-[68px] pt-20 justify-center">
      <MyPageSideBar
        {...(isMyPage
          ? { isMyPage: true as const, counts }
          : { isMyPage: false as const, sortedTags })}
      />

      <div className="flex flex-col items-start">
        <Outlet
          context={{
            isMyPage,
            cards,
            isLoading,
            error,
            hasNext,
            sentinelRef,
            reload,
            sortBy,
            setSortBy,
          }}
        />
      </div>
    </div>
  );
};

export default MyPageLayout;
