import { useEffect, useMemo } from "react";
import SortButtonGroup from "@/entities/project/ui/SortButtonGroup";
import TroubleShootingCard from "@/entities/trouble/ui/TroubleShootingCard";
import { mapToTroubleShootingCard } from "@/entities/trouble/card-compat.mapper";
import { useMyPageStore } from "@/store/useMyPageStore";
import { useNavigate, useOutletContext } from "react-router-dom";
import { PATH } from "@/shared/config/paths";
import { useViewerId } from "@/store/auth";
import { decideCombined } from "@/entities/trouble/lib/combinedRoute";
import { makePostSlug } from "@/shared/lib/slug";

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

  const statusFiltered = useMemo(() => {
    if (!isMyPage || selectedStatus === "all") return tagFiltered;

    // '원본' 탭: COMPLETED + SUMMARIZED 모두 포함
    if (selectedStatus === "complete") {
      return tagFiltered.filter(
        (c) => c.status === "complete" || c.status === "created"
      );
    }

    // 나머지(inProgress, created)는 기존 방식 유지
    return tagFiltered.filter((c) => c.status === selectedStatus);
  }, [tagFiltered, isMyPage, selectedStatus]);

  const sortedCards = statusFiltered;

  const emptyMessage = useMemo(() => {
    if (isLoading) return null;
    if (sortedCards.length > 0) return null;

    if (isMyPage) {
      if (selectedStatus === "inProgress")
        return "작성 중인 트러블슈팅이 없어요.";
      if (selectedStatus === "complete")
        return `작성 완료된 트러블슈팅이 없어요.`;
      if (selectedStatus === "created")
        return `작성+요약 완료된 트러블슈팅이 없어요.`;
      return `조건에 맞는 트러블슈팅이 없어요.`;
    } else {
      if (selectedTag) return `선택한 태그에 해당하는 트러블슈팅이 없어요.`;
      return `아직 공개된 트러블슈팅이 없어요.`;
    }
  }, [isLoading, sortedCards.length, isMyPage, selectedStatus, selectedTag]);

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
          const vm = mapToTroubleShootingCard(card);

          return (
            <TroubleShootingCard
              key={card.id}
              {...vm}
              onDeleted={handleDeleted}
              onClick={() => {
                const ownerIdForState = isMyPage
                  ? viewerId != null
                    ? Number(viewerId)
                    : undefined
                  : card.authorId != null
                  ? Number(card.authorId)
                  : undefined;

                const statusFromList = vm.status;
                const isVisibleFromList = vm.visibility === "public";
                const summaryIdFromList = vm.summaryId ?? undefined;
                const isMineFromList = !!vm.isMine || !!isMyPage;

                const qs = new URLSearchParams({ from: "mypage" });
                if (ownerIdForState != null) {
                  qs.set("ownerId", String(ownerIdForState));
                }

                const slug = makePostSlug(vm.title, card.id);

                // 1) 내 마이페이지 + '원본+요약본' 탭일 때만 합본 라우팅
                if (isMyPage && selectedStatus === "created") {
                  const { goCombined, summaryId } = decideCombined(
                    card,
                    viewerId
                  );

                  if (goCombined && summaryId != null) {
                    navigate(PATH.COMBINED_DETAIL(card.id, summaryId), {
                      state: { from: "mypage", ownerId: ownerIdForState },
                    });
                    return;
                  }

                  // (옵션) 합본 실패 시 요약본 상세로 보내고 싶다면:
                  if (summaryIdFromList != null) {
                    navigate(PATH.POST_SUMMARY(summaryIdFromList), {
                      state: { from: "mypage", ownerId: ownerIdForState },
                    });
                    return;
                  }
                }

                // 2) 그 외 탭(전체/작성중/원본)은 항상 원본 상세로 이동
                navigate(`${PATH.COMMUNITY_POST_SLUG(slug)}?${qs.toString()}`, {
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
