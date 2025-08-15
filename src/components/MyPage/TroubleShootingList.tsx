import { useMemo } from "react";
import SortButtonGroup from "../Project/SortButtonGroup";
import TroubleShootingCard from "./TroubleShootingCard";
import { mapToTroubleShootingCard } from "@/mappers/cardMapper";
import { useMyPageStore } from "@/store/useMyPageStore";
import { useOutletContext } from "react-router-dom";

interface OutletContextType {
  isMyPage: boolean;
  cards: any[];
  isLoading: boolean;
  error: string | null;
  hasNext: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  reload: () => void | Promise<void>;
  sortBy: "latest" | "likes";
  setSortBy: (v: "latest" | "likes") => void;
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

  const selectedStatus = useMyPageStore((state) => state.selectedStatus);
  const selectedTag = useMyPageStore((state) => state.selectedTag);

  // 내 마이페이지면 내 카드만, 아니면 다른 사람 카드만
  const base = useMemo(
    () =>
      isMyPage ? cards.filter((c) => c.isMine) : cards.filter((c) => !c.isMine),
    [cards, isMyPage]
  );

  // 태그 필터 (다른 사용자 마이페이지만 해당)
  const tagFiltered = useMemo(
    () =>
      !isMyPage && selectedTag
        ? base.filter((c) => c.tags?.includes(selectedTag))
        : base,
    [base, isMyPage, selectedTag]
  );

  // 상태 필터 (내 마이페이지만 해당)
  const statusFiltered = useMemo(
    () =>
      isMyPage && selectedStatus !== "all"
        ? tagFiltered.filter((c) => c.status === selectedStatus)
        : tagFiltered,
    [tagFiltered, isMyPage, selectedStatus]
  );

  const sortedCards = statusFiltered;

  const handleDeleted = () => {
    void reload();
  };

  return (
    <div className="flex flex-col items-end gap-[40px] w-[948px] pb-[78px]">
      {/* 정렬 기준 선택 */}
      {isMyPage && <SortButtonGroup selected={sortBy} onSelect={setSortBy} />}

      {/* 에러/로딩 */}
      {error && <div className="text-red-600 self-start">{error}</div>}

      {/* 트러블로그 목록 */}
      <div className="flex flex-col items-start self-stretch">
        {sortedCards.map((card) => (
          <TroubleShootingCard
            key={card.id}
            {...mapToTroubleShootingCard(card)}
            onDeleted={handleDeleted}
          />
        ))}

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <>
            <div className="w-full h-[120px] bg-gray-100 rounded mb-3" />
            <div className="w-full h-[120px] bg-gray-100 rounded mb-3" />
          </>
        )}

        {/* 무한스크롤 센티널 */}
        {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>
    </div>
  );
};

export default TroubleShootingList;
