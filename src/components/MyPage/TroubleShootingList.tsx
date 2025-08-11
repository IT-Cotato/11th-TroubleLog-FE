import { useState } from "react";
import SortButtonGroup from "../Project/SortButtonGroup";
import TroubleShootingCard from "./TroubleShootingCard";
import { mockCards } from "@/mocks/mockCards";
import { mapToTroubleShootingCard } from "@/utils/mappers/cardMapper";
import { useMyPageStore } from "@/store/useMyPageStore";
import { useOutletContext } from "react-router-dom";

interface OutletContextType {
  isMyPage: boolean;
}

const TroubleShootingList = () => {
  const { isMyPage } = useOutletContext<OutletContextType>();

  const [selectedSort, setSelectedSort] = useState<"latest" | "importance">(
    "latest"
  );
  const selectedStatus = useMyPageStore((state) => state.selectedStatus);
  const selectedTag = useMyPageStore((state) => state.selectedTag);

  const cards = isMyPage
    ? mockCards.filter((c) => c.isMine)
    : mockCards.filter((c) => !c.isMine);

  // 태그 필터 (다른 사용자 마이페이지만 해당)
  const tagFiltered =
    !isMyPage && selectedTag
      ? cards.filter((c) => c.tags.includes(selectedTag))
      : cards;

  // 상태 필터 (내 마이페이지만 해당)
  const statusFiltered =
    isMyPage && selectedStatus !== "all"
      ? tagFiltered.filter((c) => c.status === selectedStatus)
      : tagFiltered;

  // 최신순/중요도순 정렬 (마이페이지)
  const sortedCards = isMyPage
    ? [...statusFiltered].sort((a, b) =>
        selectedSort === "importance"
          ? (b.importance ?? 0) - (a.importance ?? 0)
          : b.createdAt.localeCompare(a.createdAt)
      )
    : statusFiltered;

  return (
    <div className="flex flex-col items-end gap-[40px] w-[948px] pb-[78px]">
      {/* 정렬 기준 선택 */}
      {isMyPage && (
        <SortButtonGroup selected={selectedSort} onSelect={setSelectedSort} />
      )}

      {/* 트러블로그 목록 */}
      <div className="flex flex-col items-start self-stretch">
        {sortedCards.map((card) => (
          <TroubleShootingCard
            key={card.id}
            {...mapToTroubleShootingCard(card)}
          />
        ))}
      </div>
    </div>
  );
};

export default TroubleShootingList;
