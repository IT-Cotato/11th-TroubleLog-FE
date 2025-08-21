import { useEffect, useMemo } from "react";
import SortButtonGroup from "../Project/SortButtonGroup";
import TroubleShootingCard from "./TroubleShootingCard";
import { mapToTroubleShootingCard } from "@/mappers/cardMapper";
import { useMyPageStore } from "@/store/useMyPageStore";
import { useNavigate, useOutletContext } from "react-router-dom";
import { PATH } from "@/constants/paths";
import { useViewerId } from "@/store/auth";
import { decideCombined } from "@/utils/combinedRoute";

interface OutletContextType {
  isMyPage: boolean;
  cards: any[];
  isLoading: boolean;
  error: string | null;
  hasNext: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  reload: () => void | Promise<void>;
  sortBy: "latest" | "important";
  setSortBy: (v: "latest" | "important") => void;
}

const TroubleShootingList = () => {
  const {
    isMyPage,
    cards,
    isLoading,
    error,
    hasNext,
    sentinelRef,
    sortBy,
    setSortBy,
    reload,
  } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  const viewerId = useViewerId();

  const selectedStatus = useMyPageStore((state) => state.selectedStatus);
  const selectedTag = useMyPageStore((state) => state.selectedTag);

  const shouldShowSort = isMyPage && selectedStatus !== "inProgress";

  useEffect(() => {
    if (isMyPage && selectedStatus === "inProgress" && sortBy !== "latest") {
      setSortBy("latest");
    }
  }, [isMyPage, selectedStatus, sortBy, setSortBy]);

  const base = useMemo(
    () =>
      isMyPage ? cards.filter((c) => c.isMine) : cards.filter((c) => !c.isMine),
    [cards, isMyPage]
  );

  const tagFiltered = useMemo(
    () =>
      !isMyPage && selectedTag
        ? base.filter((c) => c.tags?.includes(selectedTag))
        : base,
    [base, isMyPage, selectedTag]
  );

  const statusFiltered = useMemo(
    () =>
      isMyPage && selectedStatus !== "all"
        ? tagFiltered.filter((c) => c.status === selectedStatus)
        : tagFiltered,
    [tagFiltered, isMyPage, selectedStatus]
  );

  const sortedCards = statusFiltered;

  const emptyMessage = useMemo(() => {
    if (isLoading) return null;
    if (sortedCards.length > 0) return null;

    const sortLabel = sortBy === "latest" ? "최신순" : "중요도순";

    if (isMyPage) {
      if (selectedStatus === "inProgress")
        return "작성 중인 트러블슈팅이 없어요.";
      if (selectedStatus === "complete")
        return `작성 완료된 트러블슈팅이 없어요. (${sortLabel})`;
      if (selectedStatus === "created")
        return `작성+요약 완료된 트러블슈팅이 없어요. (${sortLabel})`;
      return `조건에 맞는 트러블슈팅이 없어요. (${sortLabel})`;
    } else {
      if (selectedTag) return `선택한 태그에 해당하는 트러블슈팅이 없어요.`;
      return `아직 공개된 트러블슈팅이 없어요. (${sortLabel})`;
    }
  }, [
    isLoading,
    sortedCards.length,
    isMyPage,
    selectedStatus,
    sortBy,
    selectedTag,
  ]);

  const handleDeleted = async () => {
    try {
      await reload();
    } catch (error) {
      console.error("Failed to reload after deletion:", error);
    }
  };

  return (
    <div className="w-full max-w-[948px] mx-auto px-4 sm:px-0 flex flex-col gap-6 sm:gap-10 pb-16 sm:pb-[78px]">
      {/* 정렬 기준 선택 (우측 정렬 유지) */}
      {shouldShowSort && (
        <div className="self-end">
          <SortButtonGroup selected={sortBy} onSelect={setSortBy} />
        </div>
      )}

      {/* 에러/로딩 */}
      {error && (
        <div className="text-red-600 self-start text-body-14-regular sm:text-body-16-regular">
          {error}
        </div>
      )}

      {/* 트러블로그 목록 */}
      <div className="flex flex-col items-start self-stretch">
        {/* 빈 상태 안내 */}
        {!error && !isLoading && sortedCards.length === 0 && emptyMessage && (
          <div className="w-full flex h-[180px] sm:h-[220px] justify-center items-center rounded-[16px] bg-white mb-3">
            <span className="text-body-16-regular sm:text-body-20-regular">
              {emptyMessage}
            </span>
          </div>
        )}

        {sortedCards.map((card) => {
          const vm = mapToTroubleShootingCard(card); // 한 번만 만들고 아래에서 재사용

          return (
            <TroubleShootingCard
              key={card.id}
              {...vm}
              onDeleted={handleDeleted}
              onClick={() => {
                // 1) 합본 분기(기존 유지)
                const { goCombined, summaryId } = decideCombined(
                  card,
                  viewerId
                );
                const ownerIdForState =
                  isMyPage && viewerId != null ? Number(viewerId) : undefined;

                if (goCombined && summaryId != null) {
                  navigate(PATH.COMBINED_DETAIL(card.id, summaryId), {
                    state: { from: "mypage", ownerId: ownerIdForState },
                  });
                  return;
                }

                // 2) CPD 힌트(state)로 확정값 전달
                const statusFromList = vm.status; // 'inProgress' | 'complete' | 'created'
                const isVisibleFromList = vm.visibility === "public";
                const summaryIdFromList = vm.summaryId ?? undefined;
                const isMineFromList = !!vm.isMine || !!isMyPage;

                const qs = new URLSearchParams({ from: "mypage" });
                if (ownerIdForState != null)
                  qs.set("ownerId", String(ownerIdForState));

                navigate(`${PATH.COMMUNITY_POST(card.id)}?${qs.toString()}`, {
                  state: {
                    from: "mypage",
                    ownerId: ownerIdForState,
                    statusFromList,
                    isVisibleFromList,
                    summaryIdFromList,
                    isMineFromList,
                  },
                });
              }}
            />
          );
        })}

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <>
            <div className="w-full h-24 sm:h-30 bg-gray-100 rounded mb-3" />
            <div className="w-full h-24 sm:h-30 bg-gray-100 rounded mb-3" />
          </>
        )}

        {/* 무한스크롤 센티널 */}
        {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>
    </div>
  );
};

export default TroubleShootingList;
