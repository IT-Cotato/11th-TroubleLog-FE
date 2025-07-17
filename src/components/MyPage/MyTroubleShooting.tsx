import { useState } from "react";
import SortButtonGroup from "../Project/SortButtonGroup";
import TroubleShootingCard from "./TroubleShootingCard";
import { mockCards } from "@/mocks/mockCards";
import { mapToTroubleShootingCard } from "@/utils/mappers/cardMapper";
import { useMyPageStore } from "@/store/useMyPageStore";

const MyTroubleShooting = () => {
  const [selectedSort, setSelectedSort] = useState<"latest" | "importance">(
    "latest"
  );

  const selectedStatus = useMyPageStore((state) => state.selectedStatus);

  const myCards = mockCards.filter((c) => c.isMine);

  // 작성 상태에 따른 필터링
  const filteredCards =
    selectedStatus === "all"
      ? myCards
      : myCards.filter((card) => card.status === selectedStatus);

  // 최신순/중요도순
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (selectedSort === "importance") {
      return (b.importance ?? 0) - (a.importance ?? 0);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="flex flex-col items-end gap-[40px] w-[948px]">
      {/* 정렬 기준 선택 */}
      <SortButtonGroup selected={selectedSort} onSelect={setSelectedSort} />

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

export default MyTroubleShooting;
