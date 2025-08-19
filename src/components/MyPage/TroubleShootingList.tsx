import { useEffect, useMemo } from "react";
import SortButtonGroup from "../Project/SortButtonGroup";
import TroubleShootingCard from "./TroubleShootingCard";
import { mapToTroubleShootingCard } from "@/mappers/cardMapper";
import { useMyPageStore } from "@/store/useMyPageStore";
import { useNavigate, useOutletContext } from "react-router-dom";
import { PATH } from "@/constants/paths";
import { useViewerId } from "@/store/auth";

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

  // 작성 중일 땐 정렬 옵션 숨김
  const shouldShowSort = isMyPage && selectedStatus !== "inProgress";

  // 작성 중으로 전환되면 정렬을 최신순으로 강제 맞춤(혼란 방지)
  useEffect(() => {
    if (isMyPage && selectedStatus === "inProgress" && sortBy !== "latest") {
      setSortBy("latest");
    }
  }, [isMyPage, selectedStatus, sortBy, setSortBy]);

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

  // 빈 상태 메시지
  const emptyMessage = useMemo(() => {
    if (isLoading) return null;
    if (sortedCards.length > 0) return null;

    const sortLabel = sortBy === "latest" ? "최신순" : "중요도순";

    if (isMyPage) {
      if (selectedStatus === "inProgress") {
        return "작성 중인 트러블슈팅이 없어요.";
      }
      if (selectedStatus === "complete") {
        return `작성 완료된 트러블슈팅이 없어요. (${sortLabel})`;
      }
      if (selectedStatus === "created") {
        return `작성+요약 완료된 트러블슈팅이 없어요. (${sortLabel})`;
      }
      return `조건에 맞는 트러블슈팅이 없어요. (${sortLabel})`;
    } else {
      // 다른 사용자 페이지
      if (selectedTag) {
        return `선택한 태그에 해당하는 트러블슈팅이 없어요.`;
      }
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
    <div className="flex flex-col items-end gap-[40px] w-[948px] pb-[78px]">
      {/* 정렬 기준 선택 */}
      {shouldShowSort && (
        <SortButtonGroup selected={sortBy} onSelect={setSortBy} />
      )}

      {/* 에러/로딩 */}
      {error && <div className="text-red-600 self-start">{error}</div>}

      {/* 트러블로그 목록 */}
      <div className="flex flex-col items-start self-stretch">
        {/* 빈 상태 안내 */}
        {!error && !isLoading && sortedCards.length === 0 && emptyMessage && (
          <div className="w-full flex h-[220px] justify-center items-center rounded-[16px] bg-white mb-3">
            <span className="text-body-20-regular">{emptyMessage}</span>
          </div>
        )}

        {sortedCards.map((card) => (
          <TroubleShootingCard
            key={card.id}
            {...mapToTroubleShootingCard(card)}
            onDeleted={handleDeleted}
            onClick={() => {
              const qs = new URLSearchParams({ from: "mypage" });
              if (isMyPage) {
                qs.set("ownerId", String(viewerId));
              }
              navigate(`${PATH.COMMUNITY_POST(card.id)}?${qs.toString()}`, {
                state: { from: "mypage" },
              });
            }}
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
