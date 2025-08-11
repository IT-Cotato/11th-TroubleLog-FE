import PostButton from "@/components/Button/PostButton";
import TroublogCard from "@/components/Card/TroublogCard";
import SummaryTypeDropdown from "@/components/Menu/SummaryTypeDropdown";
import ProjectAccordion from "@/components/Project/ProjectAccordion";
import SortButtonGroup from "@/components/Project/SortButtonGroup";
import StatusFilterButton from "@/components/Project/StatusFilterButton";
import { useEffect, useMemo, useState } from "react";
import type { StatusType } from "@/types/project";
import GenericDropdown from "@/components/Menu/GenericDropdown";
import { useLocation, useParams } from "react-router-dom";
import useTroubleCards from "@/hooks/useTroubleCards";
import { getProjectList } from "@/api/project.api";

type VisibilityOption = "전체" | "공개" | "비공개";

export default function ProjectDetailPage() {
  const { id: routeProjectId } = useParams<{ id: string }>();
  const projectId = Number(routeProjectId);

  // 라우팅 시 폴더 카드에서 넘겨준 이름 사용, 없으면 api로 조회
  const location = useLocation() as { state?: { projectName?: string } };
  const [projectName, setProjectName] = useState<string>(
    location.state?.projectName ?? "프로젝트"
  );
  const [titleLoading, setTitleLoading] = useState(
    !location.state?.projectName
  );

  useEffect(() => {
    const needFetch = !location.state?.projectName;
    if (!needFetch) return;
    (async () => {
      try {
        setTitleLoading(true);
        const list = await getProjectList();
        const found = list.find((p) => p.id === projectId);
        if (found) setProjectName(found.name);
      } finally {
        setTitleLoading(false);
      }
    })();
  }, [location.state?.projectName, projectId]);

  const visibilityOptions: VisibilityOption[] = ["전체", "공개", "비공개"];

  const [selectedStatus, setSelectedStatus] = useState<StatusType>("complete");
  const [selectedSort, setSelectedSort] = useState<"latest" | "importance">(
    "latest"
  );
  const [selectedVisibility, setSelectedVisibility] =
    useState<VisibilityOption>("전체");
  const [selectedSummaryType, setSelectedSummaryType] = useState("전체");

  // 프로젝트별 트러블슈팅 목록 로드
  const { cards, isLoading, error } = useTroubleCards({
    type: "project",
    projectId,
  });

  // 상태 필터
  const statusFiltered = useMemo(
    () => cards.filter((c) => c.status === selectedStatus),
    [cards, selectedStatus]
  );

  // 공개/요약유형 필터
  const filteredByVisibilityOrSummary = useMemo(() => {
    if (selectedStatus === "complete") {
      if (selectedVisibility === "전체") return statusFiltered;
      return statusFiltered.filter((c) =>
        selectedVisibility === "공개"
          ? c.visibility === "public"
          : c.visibility === "private"
      );
    } else {
      if (selectedSummaryType === "전체") return statusFiltered;
      return statusFiltered.filter(
        (c) => c.summaryType === selectedSummaryType
      );
    }
  }, [statusFiltered, selectedStatus, selectedVisibility, selectedSummaryType]);

  // 정렬
  const filteredCards = useMemo(
    () =>
      [...filteredByVisibilityOrSummary].sort((a, b) =>
        selectedSort === "latest"
          ? new Date(b.createdAtIso).getTime() -
            new Date(a.createdAtIso).getTime()
          : (b.importance ?? 0) - (a.importance ?? 0)
      ),
    [filteredByVisibilityOrSummary, selectedSort]
  );

  return (
    <div className="flex w-full px-[156px] pt-[79px] pb-[158px] flex-col items-start gap-[36px]">
      {/* 상단 나의 프로젝트 텍스트 및 글쓰기 버튼 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <span className="text-head-32-regular">나의 프로젝트</span>
        <PostButton />
      </div>

      {/* 프로젝트 아코디언 영역 */}
      <ProjectAccordion title={titleLoading ? "불러오는 중…" : projectName}>
        <div className="flex flex-col sm:flex-row justify-between gap-4 w-full">
          {/* 작성 상태 필터 버튼 */}
          <div className="flex items-center gap-[24px] self-stretch">
            {/* 작성 완료 필터 버튼 */}
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

          {/* 정렬 기준 버튼 (최신순/중요도순) 및 공개/비공개 필터 드롭다운 or 요약 유형 필터 드롭다운 */}
          <div className="inline-flex items-center gap-[40px]">
            <SortButtonGroup
              selected={selectedSort}
              onSelect={setSelectedSort}
            />
            {selectedStatus === "complete" ? (
              <GenericDropdown<VisibilityOption>
                options={visibilityOptions}
                selected={selectedVisibility}
                onSelect={setSelectedVisibility}
              />
            ) : (
              <SummaryTypeDropdown
                selected={selectedSummaryType}
                onSelect={setSelectedSummaryType}
              />
            )}
          </div>
        </div>

        {/* 트러블로그 카드 목록 (조건부) */}
        {isLoading ? (
          <div className="w-full flex h-[220px] justify-center items-center rounded-[16px] bg-white shadow-card">
            <span className="text-body-20-regular">불러오는 중…</span>
          </div>
        ) : error ? (
          <div className="w-full flex h-[220px] justify-center items-center rounded-[16px] bg-white shadow-card">
            <span className="text-body-20-regular text-red-500">
              목록 로드 실패
            </span>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="w-full flex h-[220px] justify-center items-center rounded-[16px] bg-white shadow-card">
            <span className="text-body-20-regular">
              아직 작성된 트러블슈팅이 없어요.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center sm:justify-start gap-[24px] w-full">
            {filteredCards.map((card) => (
              <TroublogCard key={card.id} {...card} />
            ))}
          </div>
        )}
      </ProjectAccordion>
    </div>
  );
}
