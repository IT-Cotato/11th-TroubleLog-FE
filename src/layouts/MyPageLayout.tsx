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

  // userId 숫자 파싱 (없거나 잘못된 경우 NaN)
  const userIdNum = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : NaN;
  }, [id]);

  // 훅에 넘길 source를 미리 계산
  const source = useMemo(
    () =>
      isMyPage
        ? ({ type: "all" } as const)
        : ({ type: "user", userId: userIdNum } as const),
    [isMyPage, userIdNum]
  );

  // user 페이지인데 id가 유효하지 않으면 로딩을 막아두기
  const enabled = isMyPage || Number.isFinite(userIdNum);

  const { cards, isLoading, error, hasNext, sentinelRef, reload } =
    useTroubleCards(source, {
      infinite: true,
      pageSize: 10,
      sortBy,
      enabled,
    });

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

  // 다른 사용자의 마이페이지용 태그 분석
  const sortedTags = useMemo<[string, number][]>(() => {
    if (cards.length === 0) return [];

    const counter = new Map<string, number>();
    for (const c of cards) {
      if (!Array.isArray(c.tags)) continue;
      for (const raw of c.tags) {
        const tag = String(raw ?? "").trim();
        if (!tag) continue;
        counter.set(tag, (counter.get(tag) ?? 0) + 1);
      }
    }

    // count 내림차순, count 같으면 이름 오름차순
    return Array.from(counter.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    );
  }, [cards]);

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
