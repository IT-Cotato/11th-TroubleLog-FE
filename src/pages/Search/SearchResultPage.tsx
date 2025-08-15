import TroubleShootingCard from "@/components/MyPage/TroubleShootingCard";
import { useInfiniteCommunityTroubleSearch } from "@/hooks/useInfiniteCommunityTroubleSearch";
import { useInfiniteMyTroubleSearch } from "@/hooks/useInfiniteMyTroubleSearch";
import { useInfiniteUserTroubleSearch } from "@/hooks/useInfiniteUserTroubleSearch";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

type CardData = Omit<TroubleShootingCardProps, "onDeleted">;

const SearchResultPage = () => {
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const query = sp.get("query") ?? "";
  // scope: 화이트리스트로 안전하게 정규화
  type SearchScope = "my" | "mypage" | "user" | "community";
  const scopeRaw = sp.get("scope");
  const scope: SearchScope =
    scopeRaw === "my" ||
    scopeRaw === "mypage" ||
    scopeRaw === "user" ||
    scopeRaw === "community"
      ? scopeRaw
      : "community";
  // size: 1~50 범위로 클램프
  const sizeParam = Number(sp.get("size"));
  const size =
    Number.isFinite(sizeParam) && sizeParam >= 1 && sizeParam <= 50
      ? sizeParam
      : 10;
  // userId: 정수 문자열만 허용
  const userIdStr = sp.get("userId");
  const userId =
    userIdStr && /^\d+$/.test(userIdStr) ? Number(userIdStr) : null;

  const isMyScope = scope === "my" || scope === "mypage";
  const isUserScope = scope === "user" && !!userId;
  const isCommunityScope = scope === "community";

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

  // 커뮤니티 게시글 검색
  const community = useInfiniteCommunityTroubleSearch(
    isCommunityScope ? query : "",
    size
  );

  // 활성 훅 선택
  const active = isUserScope ? other : isMyScope ? my : community;
  // 활성 훅이 바뀔 때 비교용 키(불필요한 재부착 방지)
  const activeKey = isUserScope
    ? `user:${userId}`
    : isMyScope
    ? "my"
    : "community";

  const loadingInitial = active.loadingInitial;
  const loadingMore = active.loadingMore;
  const error = active.error;
  const items = active.items;
  const totalElements = active.totalElements;
  const hasNext = active.hasNext;

  // 하단 센티널 관찰자
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreRef = useRef<() => void>(() => {});
  useEffect(() => {
    loadMoreRef.current = active.loadMore;
  }, [active.loadMore]);

  useEffect(() => {
    const el = sentinelRef.current;

    // 센티널이 없거나 더 로드할 게 없으면 관찰 안 함
    if (!el || !hasNext) return;

    // 기존 옵저버 있으면 정리 (StrictMode/리렌더 대응)
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // 최신 loadMore 실행
          loadMoreRef.current?.();
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 }
    );

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [hasNext, activeKey, query, size]);

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
