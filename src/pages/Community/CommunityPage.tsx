import TroublogCard from "@/components/Card/TroublogCard";
import GenericDropdown from "@/components/Menu/GenericDropdown";
import { PATH } from "@/constants/paths";
import useCommunityCards from "@/hooks/useCommunityCards";
import type { CommunitySort } from "@/types/community.model";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CommunityPage() {
  const navigate = useNavigate();

  const sortOptions = ["전체", "최신순", "추천순", "좋아요순"] as const;
  type SortOption = (typeof sortOptions)[number];

  const [selectedSort, setSelectedSort] = useState<SortOption>("전체");
  const [selectedTab, setSelectedTab] = useState<"trouble" | "recent">(
    "trouble"
  );

  // UI 라벨 -> API sort 파라미터 매핑
  const sortBy: CommunitySort = useMemo(() => {
    if (selectedSort === "최신순" || selectedSort === "전체") return "latest";
    // "추천순" / "좋아요순" 모두 likes에 매핑
    return "likes";
  }, [selectedSort]);

  // 커뮤니티 목록 불러오기 (무한스크롤)
  const { cards, isLoading, error, hasNext, sentinelRef } = useCommunityCards({
    sortBy,
    pageSize: 12,
    infinite: true,
    rootMargin: "400px 0px",
  });

  return (
    <div className="flex flex-col mt-[79px] mb-[104px] max-w-[1600px] w-full mx-auto px-4 gap-[50px]">
      <div className="flex w-full justify-between">
        {/* 옵션 탭 */}
        <div className="flex gap-[40px]">
          {/* 트러블 슈팅 둘러보기 탭*/}
          <button onClick={() => setSelectedTab("trouble")}>
            <div className="flex flex-col items-start gap-[8px]">
              <span
                className={`text-head-32-regular ${
                  selectedTab === "trouble" ? "text-black" : "text-gray3"
                }`}
              >
                트러블 슈팅 둘러보기
              </span>
              <div
                className={`h-[3px] w-full transition-colors duration-200 ${
                  selectedTab === "trouble" ? "bg-black" : "bg-transparent"
                }`}
              />
            </div>
          </button>

          {/* 최근 읽은 포스트 탭*/}
          <button onClick={() => setSelectedTab("recent")}>
            <div className="flex flex-col items-start gap-[8px]">
              <span
                className={`text-head-32-regular ${
                  selectedTab === "recent" ? "text-black" : "text-gray3"
                }`}
              >
                최근 읽은 포스트
              </span>
              <div
                className={`h-[3px] w-full transition-colors duration-200 ${
                  selectedTab === "recent" ? "bg-black" : "bg-transparent"
                }`}
              />
            </div>
          </button>
        </div>

        {/* 정렬 옵션 드롭다운 */}
        {selectedTab === "trouble" && (
          <GenericDropdown<SortOption>
            options={sortOptions}
            selected={selectedSort}
            onSelect={setSelectedSort}
          />
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="text-red-600 text-body-16-regular">{error}</div>
      )}

      {/* 트러블로그 카드 */}
      <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-[24px] gap-y-[60px]">
        {selectedTab === "trouble"
          ? cards.map((card) => (
              <div
                key={card.id}
                className="cursor-pointer"
                onClick={() => navigate(PATH.COMMUNITY_POST(card.id))}
              >
                <TroublogCard {...card} />
              </div>
            ))
          : null}

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <>
            <div className="w-full h-[300px] bg-gray-100 rounded-2xl" />
            <div className="w-full h-[300px] bg-gray-100 rounded-2xl" />
            <div className="w-full h-[300px] bg-gray-100 rounded-2xl" />
          </>
        )}

        {/* 무한스크롤 센티널 */}
        {selectedTab === "trouble" && hasNext && (
          <div ref={sentinelRef} style={{ height: 1 }} />
        )}
      </div>
    </div>
  );
}
