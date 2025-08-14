import TroubleShootingCard from "@/components/MyPage/TroubleShootingCard";
import { useInfiniteMyTroubleSearch } from "@/hooks/useInfiniteMyTroubleSearch";
import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";

const SearchResultPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get("query") || "";
  const scope = params.get("scope") || "community";
  const size = Number(params.get("size") ?? 10) || 10;

  const isMyScope = scope === "my" || scope === "mypage";

  const searchOpts = useMemo(
    () => ({ isMine: true, authorName: "나", isSearchResult: true }),
    []
  );

  // 훅 호출
  const { items, loadingInitial, loadingMore, error, totalElements, loadMore } =
    useInfiniteMyTroubleSearch(isMyScope ? query : "", size, searchOpts);

  // 하단 센티널 관찰자
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMore(); // 내부에서 loading/hasNext/inflight 체크
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
      io.unobserve(el);
      io.disconnect();
    };
  }, [loadMore]);

  if (!isMyScope) {
    return (
      <div className="mt-[179px] mb-[68px] flex w-[1200px] flex-col items-start gap-[24px] mx-auto">
        <span className="text-head-32-regular self-stretch">
          아직 지원하지 않는 검색 범위입니다.
        </span>
      </div>
    );
  }

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
          <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
      </div>
    </div>
  );
};

export default SearchResultPage;
