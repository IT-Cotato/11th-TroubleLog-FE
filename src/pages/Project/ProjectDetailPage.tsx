import PostButton from "@/components/Button/PostButton";
import TroublogCard from "@/components/Card/TroublogCard";
import VisibilityFilterDropdown from "@/components/Menu/VisibilityFilterDropdown";
import ProjectAccordion from "@/components/Project/ProjectAccordion";
import SortButtonGroup from "@/components/Project/SortButtonGroup";
import StatusFilterButton from "@/components/Project/StatusFilterButton";
import { mockCards } from "@/mocks/mockCards";
import { useState } from "react";

interface ProjectDetailPageProps {
  projectName: string;
}

type StatusType = "complete" | "created";

export default function ProjectDetailPage({
  projectName,
}: ProjectDetailPageProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusType>("complete");
  const [selectedSort, setSelectedSort] = useState<"latest" | "importance">(
    "latest"
  );
  const [selectedVisibility, setSelectedVisibility] = useState<
    "전체" | "공개" | "비공개"
  >("전체");

  // 트러블로그 카드 목록 필터링
  const statusFiltered = mockCards.filter(
    (card) => card.status === selectedStatus
  );
  const visibilityFiltered = statusFiltered.filter((card) => {
    if (selectedVisibility === "전체") return true;
    return selectedVisibility === "공개"
      ? card.visibility === "public"
      : card.visibility === "private";
  });
  const filteredCards = visibilityFiltered.sort((a, b) =>
    selectedSort === "latest"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : (b.importance ?? 0) - (a.importance ?? 0)
  );

  return (
    <div className="px-4 sm:px-6 md:px-8 py-[60px] sm:py-[79px] flex flex-col items-start gap-[36px]">
      {/* 상단 나의 프로젝트 텍스트 및 글쓰기 버튼 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <span className="text-head-32-regular">나의 프로젝트</span>
        <PostButton />
      </div>
      {/* 프로젝트 아코디언 영역 */}
      <ProjectAccordion projectName={projectName}>
        <div className="flex flex-col sm:flex-row justify-between gap-4 w-full">
          {/* 작성 상태 필터 버튼 */}
          <div className="flex items-center gap-[24px] self-stretch">
            {/* 작성 완료 필터 버튼 (선택된 상태)*/}
            <StatusFilterButton
              label="작성 완료"
              statusKey="complete"
              isSelected={selectedStatus === "complete"}
              onClick={() => setSelectedStatus("complete")}
            />
            {/* 요약 완료 필터 버튼 */}
            <StatusFilterButton
              label="요약 완료"
              statusKey="created"
              isSelected={selectedStatus === "created"}
              onClick={() => setSelectedStatus("created")}
            />
          </div>
          {/* 정렬 기준 버튼 (최신순/중요도순) 및 공개/비공개 필터 드롭다운 */}
          <div className="inline-flex items-center gap-[40px]">
            <SortButtonGroup
              selected={selectedSort}
              onSelect={setSelectedSort}
            />
            <VisibilityFilterDropdown
              selected={selectedVisibility}
              onSelect={setSelectedVisibility}
            />
          </div>
        </div>

        {/* 트러블로그 카드 목록 (조건부) */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-[24px] w-full">
          {filteredCards.map((card, idx) => (
            <TroublogCard key={idx} {...card} />
          ))}
        </div>
      </ProjectAccordion>
    </div>
  );
}
