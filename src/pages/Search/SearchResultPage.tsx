import TroubleShootingCard from "@/components/MyPage/TroubleShootingCard";
import { useInfiniteMyTroubleSearch } from "@/hooks/useInfiniteMyTroubleSearch";
import { useInfiniteUserTroubleSearch } from "@/hooks/useInfiniteUserTroubleSearch";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const SearchResultPage = () => {
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const query = sp.get("query") ?? "";
  const scope = (sp.get("scope") ?? "community") as
    | "my"
    | "mypage"
    | "user"
    | "community";
  const size = Number(sp.get("size") ?? 10) || 10;
  const userIdParam = sp.get("userId");
  const userId = userIdParam ? Number(userIdParam) : null;

  const isMyScope = scope === "my" || scope === "mypage";
  const isUserScope = scope === "user" && !!userId;

  // 현재 로그인한 사용자 트러블슈팅 문서 내 검색
  const my = useInfiniteMyTroubleSearch(
    isMyScope ? query : "",
    size,
    { isMine: true, authorName: "나", isSearchResult: true },
    { enabled: isMyScope }
  );

  // 특정 사용자 트러블슈팅 문서 내 검색
  const other = useInfiniteUserTroubleSearch(
    isUserScope ? query : "",
    userId,
    size
  );

  // 활성 훅 선택
  const active = isUserScope ? other : my;

  // 하단 센티널 관찰자
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMoreRef = useRef<() => void>(() => {});
  useEffect(() => {
    loadMoreRef.current = active.loadMore;
  }, [active.loadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMoreRef.current?.();
        }
      },
      {
        root: null, // viewport
        rootMargin: "400px 0px", // 미리 당겨서 로드
        threshold: 0,
      }
    );

    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, []);

  if (!isMyScope && !isUserScope) {
    return (
      <div className="mt-[179px] mb-[68px] flex w-[1200px] flex-col items-start gap-[24px] mx-auto">
        <span className="text-head-32-regular self-stretch">
          아직 지원하지 않는 검색 범위입니다.
        </span>
      </div>
    );
  }

  const loadingInitial = active.loadingInitial;
  const loadingMore = active.loadingMore;
  const error = active.error;
  const items = active.items;
  const totalElements = active.totalElements;
  const hasNext = active.hasNext;

  return (
    <div className="mt-[179px] mb-[68px] flex w-[1200px] flex-col items-start gap-[56px] mx-auto">
      <span className="text-head-32-regular self-stretch">
        {loadingInitial
          ? "검색 중…"
          : `총 ${totalElements}개의 포스트를 찾았어요.`}
      </span>

      {/* 에러 */}
      {error && (
        <div className="text-red-600 text-body-16-regular">{error}</div>
      )}

      {/* 결과 리스트 */}
      <div className="flex flex-col items-start self-stretch">
        {loadingInitial && items.length === 0 ? (
          <>
            <div className="w-full h-[120px] bg-gray-100 rounded mb-3" />
            <div className="w-full h-[120px] bg-gray-100 rounded mb-3" />
          </>
        ) : items.length === 0 ? (
          <div className="text-gray-500 text-body-16-regular mt-4">
            검색 결과가 없습니다.
          </div>
        ) : (
          items.map((card) => <TroubleShootingCard key={card.id} {...card} />)
        )}

        {/* 로딩 인디케이터 / 센티널 */}
        <div className="w-full flex flex-col items-center mt-4">
          {loadingMore && (
            <div className="w-full h-[120px] bg-gray-100 rounded mb-3" />
          )}
          {/* 이 div가 뷰포트에 들어오면 다음 페이지 로드 시도 */}
          {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}
        </div>
      </div>
    </div>
  );
};

export default SearchResultPage;
