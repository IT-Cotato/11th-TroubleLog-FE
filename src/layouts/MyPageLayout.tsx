import MyPageSideBar from "@/components/MyPage/MyPageSidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import useTroubleCards from "@/hooks/useTroubleCards";
import { useMemo, useState } from "react";
import { useViewerId } from "@/store/auth";
import { PATH } from "@/constants/paths";

const MyPageLayout = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const viewerId = useViewerId();
  const myUserIdStr = viewerId != null ? String(viewerId) : null;

  const myUserId = typeof window !== "undefined" ? myUserIdStr : null;
  const isMyPage = !!myUserId && id === myUserId;

  // 정렬 상태
  const [sortBy, setSortBy] = useState<"latest" | "importance">("latest");

  // userId 숫자 파싱 (없거나 잘못된 경우 NaN)
  const userIdNum = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : NaN;
  }, [id]);

  // URL에서 tag 쿼리 읽기 (없으면 null)
  const selectedTag = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const t = sp.get("tag");
    return t && t.trim() ? t : null;
  }, [location.search]);

  // 서브메뉴(팔로잉/팔로워 등) 어디에서든 태그 클릭 시 메인 마이페이지로 이동
  const handleSelectTag = (tag: string | null) => {
    if (!id) return;
    const url = tag
      ? `${PATH.MYPAGE(id)}?tag=${encodeURIComponent(tag)}`
      : PATH.MYPAGE(id);
    navigate(url);
    // 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 훅에 넘길 source를 미리 계산
  const source = useMemo(
    () =>
      isMyPage
        ? ({ type: "all", tag: selectedTag ?? undefined } as const)
        : ({
            type: "user",
            userId: userIdNum,
            tag: selectedTag ?? undefined,
          } as const),
    [isMyPage, userIdNum, selectedTag]
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

  // 클라이언트 필터 적용
  const visibleCards = useMemo(() => {
    if (!selectedTag) return cards;
    return cards.filter((c) =>
      Array.isArray(c.tags) ? c.tags.includes(selectedTag) : false
    );
  }, [cards, selectedTag]);

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
    return Array.from(counter.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    );
  }, [cards]);

  return (
    <div className="flex items-start gap-[68px] pt-20 justify-center">
      <MyPageSideBar
        {...(isMyPage
          ? { isMyPage: true as const, counts }
          : {
              isMyPage: false as const,
              sortedTags,
              selectedTag,
              onSelectTag: handleSelectTag,
            })}
      />

      <div className="flex flex-col items-start">
        <Outlet
          context={{
            isMyPage,
            cards: visibleCards,
            isLoading,
            error,
            hasNext,
            sentinelRef,
            reload,
            sortBy,
            setSortBy,
            selectedTag,
          }}
        />
      </div>
    </div>
  );
};

export default MyPageLayout;
