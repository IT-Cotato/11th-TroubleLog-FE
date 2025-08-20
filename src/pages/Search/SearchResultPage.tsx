import TroubleShootingCard from "@/components/MyPage/TroubleShootingCard";
import { PATH } from "@/constants/paths";
import { useInfiniteCommunityTroubleSearch } from "@/hooks/useInfiniteCommunityTroubleSearch";
import { useInfiniteMyTroubleSearch } from "@/hooks/useInfiniteMyTroubleSearch";
import { useInfiniteUserTroubleSearch } from "@/hooks/useInfiniteUserTroubleSearch";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useViewerId } from "@/store/auth";
import { decideCombined } from "@/utils/combinedRoute";

const SearchResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const sp = new URLSearchParams(location.search);
  const query = sp.get("query") ?? "";

  type SearchScope = "my" | "mypage" | "user" | "community";
  const scopeRaw = sp.get("scope");
  const scope: SearchScope =
    scopeRaw === "my" ||
    scopeRaw === "mypage" ||
    scopeRaw === "user" ||
    scopeRaw === "community"
      ? scopeRaw
      : "community";

  const sizeParam = Number(sp.get("size"));
  const size =
    Number.isFinite(sizeParam) && sizeParam >= 1 && sizeParam <= 50
      ? sizeParam
      : 10;

  const userIdStr = sp.get("userId");
  const userId =
    userIdStr && /^\d+$/.test(userIdStr) ? Number(userIdStr) : null;

  const isMyScope = scope === "my" || scope === "mypage";
  const isUserScope = scope === "user" && !!userId;
  const isCommunityScope = scope === "community";

  const viewerId = useViewerId();

  const scopeForDetail: "my" | "community" = isMyScope ? "my" : "community";

  const isBlocked = (card: any) => {
    const vis = String(card.visibility ?? "").toUpperCase();
    const st = String(card.status ?? "").toUpperCase();
    const mine = !!card.isMine;
    return vis === "PRIVATE" || (st === "INPROGRESS" && !mine);
  };

  const my = useInfiniteMyTroubleSearch(
    isMyScope ? query : "",
    size,
    { isMine: true, authorName: "나", isSearchResult: true },
    { enabled: isMyScope }
  );

  const other = useInfiniteUserTroubleSearch(
    isUserScope ? query : "",
    userId,
    size
  );

  const community = useInfiniteCommunityTroubleSearch(
    isCommunityScope ? query : "",
    size
  );

  const active = isUserScope ? other : isMyScope ? my : community;
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
  const displayTotal = (active as any).displayTotal ?? totalElements;
  const hasNext = active.hasNext;

  // 무한스크롤
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<() => void>(() => {});
  useEffect(() => {
    loadMoreRef.current = active.loadMore;
  }, [active.loadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNext) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) loadMoreRef.current?.();
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
    <div className="mt-24 sm:mt-32 lg:mt-[179px] mb-10 sm:mb-14 lg:mb-[68px] w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-start gap-6 sm:gap-10">
      <span className="text-head-28-regular sm:text-head-32-regular self-stretch">
        {loadingInitial
          ? "검색 중…"
          : `총 ${displayTotal}개의 포스트를 찾았어요.`}
      </span>

      {error && (
        <div className="text-red-600 text-body-14-regular sm:text-body-16-regular">
          {error}
        </div>
      )}

      <div className="flex flex-col items-start self-stretch">
        {loadingInitial && items.length === 0 ? (
          <>
            <div className="w-full h-[96px] sm:h-[120px] bg-gray-100 rounded mb-3" />
            <div className="w-full h-[96px] sm:h-[120px] bg-gray-100 rounded mb-3" />
          </>
        ) : items.length === 0 ? (
          <div className="text-gray-500 text-body-14-regular sm:text-body-16-regular mt-4">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3 sm:gap-4">
            {items.map((card) => {
              const blocked = isBlocked(card);
              const idNum =
                typeof card.id === "number"
                  ? card.id
                  : Number.parseInt(String(card.id), 10);
              const idValid = Number.isFinite(idNum);

              return (
                <TroubleShootingCard
                  key={card.id}
                  {...card}
                  onClick={
                    blocked || !idValid
                      ? undefined
                      : () => {
                          const { goCombined, summaryId } = decideCombined(
                            card,
                            viewerId
                          );
                          const ownerIdForState =
                            card.isMine && viewerId != null
                              ? Number(viewerId)
                              : undefined;

                          if (goCombined && summaryId != null) {
                            navigate(PATH.COMBINED_DETAIL(idNum, summaryId), {
                              state: {
                                from: "search",
                                searchScope: scopeForDetail,
                                ownerId: ownerIdForState,
                              },
                            });
                          } else {
                            const url = `${PATH.COMMUNITY_POST(
                              idNum
                            )}?from=search&scope=${scopeForDetail}`;
                            navigate(url, {
                              state: {
                                from: "search",
                                searchScope: scopeForDetail,
                                ownerId: ownerIdForState,
                              },
                            });
                          }
                        }
                  }
                  disabled={blocked || !idValid}
                />
              );
            })}
          </div>
        )}

        <div className="w-full flex flex-col items-center mt-4">
          {loadingMore && (
            <div className="w-full h-[96px] sm:h-[120px] bg-gray-100 rounded mb-3" />
          )}
          {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}
        </div>
      </div>
    </div>
  );
};

export default SearchResultPage;
