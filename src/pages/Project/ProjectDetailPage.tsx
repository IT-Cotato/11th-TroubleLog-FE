import PostButton from "@/components/Button/PostButton";
import TroublogCard from "@/components/Card/TroublogCard";
import SummaryTypeDropdown from "@/components/Menu/SummaryTypeDropdown";
import ProjectAccordion from "@/components/Project/ProjectAccordion";
import SortButtonGroup from "@/components/Project/SortButtonGroup";
import StatusFilterButton from "@/components/Project/StatusFilterButton";
import { useCallback, useEffect, useMemo, useState } from "react";
import GenericDropdown from "@/components/Menu/GenericDropdown";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useTroubleCards from "@/hooks/useTroubleCards";
import { getProjectDetail } from "@/api/project.api";
import type {
  ProjectTroubleQuery,
  ProjectTroubleSummaryType,
} from "@/types/trouble.model";
import { PATH } from "@/constants/paths";
import useClickOutside from "@/hooks/useClickOutside";
import { useViewerId } from "@/store/auth";
import { decideCombined } from "@/utils/combinedRoute";

type VisibilityOption = "전체" | "공개" | "비공개";
type StatusType = "complete" | "created";
type SortUI = "latest" | "important";

export default function ProjectDetailPage() {
  const { id: routeProjectId } = useParams<{ id: string }>();
  const projectId = Number(routeProjectId);
  const isInvalid = Number.isNaN(projectId);
  const viewerId = useViewerId();

  const [removedRecentIds, setRemovedRecentIds] = useState<Set<number>>(
    new Set()
  );

  const location = useLocation() as { state?: { projectName?: string } };
  const [projectName, setProjectName] = useState<string>(
    location.state?.projectName ?? "프로젝트"
  );
  const [titleLoading, setTitleLoading] = useState(
    !location.state?.projectName && !isInvalid
  );

  const hasProjectName = Boolean(location.state?.projectName);

  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useClickOutside(() => setShowDropdown(false));

  const goGuide = useCallback(
    (projectId?: number) => {
      setShowDropdown(false);
      navigate(PATH.TEMP_WRITING, { state: { projectId } });
    },
    [navigate]
  );

  const goFreeform = useCallback(
    (projectId?: number) => {
      setShowDropdown(false);
      navigate(PATH.FREEFORM_WRITING, { state: { projectId } });
    },
    [navigate]
  );

  const handleGoGuideTemplate = () => goGuide();
  const handleGoFreeformTemplate = () => goFreeform();
  const handlePostClick = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isInvalid || hasProjectName) return;
    (async () => {
      try {
        setTitleLoading(true);
        const detail = await getProjectDetail(projectId);
        if (detail?.name) setProjectName(detail.name);
      } finally {
        setTitleLoading(false);
      }
    })();
  }, [projectId, isInvalid, hasProjectName]);

  const visibilityOptions: VisibilityOption[] = ["전체", "공개", "비공개"];
  const [selectedStatus, setSelectedStatus] = useState<StatusType>("complete");
  const [selectedSort, setSelectedSort] = useState<SortUI>("latest");
  const [selectedVisibility, setSelectedVisibility] =
    useState<VisibilityOption>("전체");
  const [selectedSummaryType, setSelectedSummaryType] =
    useState<ProjectTroubleSummaryType | null>(null);

  const toApiStatus = (s: StatusType) =>
    s === "complete" ? "COMPLETED" : ("SUMMARIZED" as const);
  const toApiSort = (s: SortUI) =>
    s === "latest" ? "LATEST" : ("LIKES" as const);
  const toApiVisibility = (v: VisibilityOption) =>
    v === "공개" ? "PUBLIC" : v === "비공개" ? "PRIVATE" : "ALL";

  const query: ProjectTroubleQuery = useMemo(() => {
    const base: ProjectTroubleQuery = {
      status: toApiStatus(selectedStatus),
      sort: toApiSort(selectedSort),
    };
    if (selectedStatus === "complete") {
      if (selectedVisibility !== "전체")
        base.visibility = toApiVisibility(selectedVisibility);
    } else {
      if (selectedSummaryType) base.summaryType = selectedSummaryType;
    }
    return base;
  }, [selectedStatus, selectedSort, selectedVisibility, selectedSummaryType]);

  const troubleParams = useMemo(
    () => ({ type: "project" as const, projectId, query }),
    [projectId, query]
  );
  const troubleOpts = useMemo(() => ({ enabled: !isInvalid }), [isInvalid]);

  const { cards, isLoading, error } = useTroubleCards(
    troubleParams,
    troubleOpts
  );

  const handleRecentDeleted = useCallback((postId: number) => {
    setRemovedRecentIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
  }, []);

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-[156px] pt-14 sm:pt-[79px] pb-24 sm:pb-[158px] flex flex-col items-start gap-6 sm:gap-[36px]">
      {/* 상단 타이틀 + 글쓰기 버튼 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <span className="text-head-32-regular">나의 프로젝트</span>
        <div ref={dropdownRef} className="relative">
          <PostButton onClick={handlePostClick} />

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-[184px] rounded-[8px] shadow-card bg-subColor2 z-10">
              <button
                type="button"
                onClick={handleGoGuideTemplate}
                className="flex w-full pt-[8px] pb-[9px] justify-center items-center border-b border-gray2 text-body-16-regular"
              >
                가이드 템플릿
              </button>
              <button
                type="button"
                onClick={handleGoFreeformTemplate}
                className="flex w-full pt-[8px] pb-[9px] justify-center items-center text-body-16-regular"
              >
                자유 템플릿
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 프로젝트 아코디언 */}
      {isInvalid ? (
        <div className="w-full flex h-[220px] justify-center items-center rounded-[16px] bg-white shadow-card">
          <span className="text-body-20-regular">
            잘못된 프로젝트 주소입니다.
          </span>
        </div>
      ) : (
        <ProjectAccordion
          title={titleLoading ? "불러오는 중…" : projectName}
          persistKey={`project:${projectId}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 w-full md:flex-nowrap">
            {/* 상태 필터 */}
            <div className="flex items-center gap-3 sm:gap-6 self-stretch">
              <StatusFilterButton
                label="작성 완료"
                statusKey="complete"
                isSelected={selectedStatus === "complete"}
                onClick={() => setSelectedStatus("complete")}
              />
              <StatusFilterButton
                label="요약 완료"
                statusKey="created"
                isSelected={selectedStatus === "created"}
                onClick={() => setSelectedStatus("created")}
              />
            </div>

            {/* 정렬 + 공개/요약유형 드롭다운 */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 md:gap-10">
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

          {/* 카드 목록 */}
          {isLoading ? (
            <div className="w-full flex h-[200px] sm:h-[220px] justify-center items-center rounded-[16px] bg-white shadow-card">
              <span className="text-body-20-regular">불러오는 중…</span>
            </div>
          ) : error ? (
            <div className="w-full flex h-[200px] sm:h-[220px] justify-center items-center rounded-[16px] bg-white shadow-card">
              <span className="text-body-20-regular text-red-500">
                목록 로드 실패
              </span>
            </div>
          ) : cards.length === 0 ? (
            <div className="w-full flex h-[200px] sm:h-[220px] justify-center items-center rounded-[16px] bg-white shadow-card">
              <span className="text-body-20-regular">
                아직 작성된 트러블슈팅이 없어요.
              </span>
            </div>
          ) : (
            <div className="grid w-full gap-[16px] sm:gap-[24px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards
                .filter((c) => !removedRecentIds.has(c.id))
                .map((card) => (
                  <TroublogCard
                    key={card.id}
                    {...card}
                    onDeleted={handleRecentDeleted}
                    onClick={() => {
                      const ownerId = card.authorId ?? viewerId;
                      const qs = new URLSearchParams({ from: "project" });
                      if (ownerId != null) qs.set("ownerId", String(ownerId));

                      const { goCombined, summaryId } = decideCombined(
                        card,
                        viewerId
                      );
                      if (goCombined && summaryId != null) {
                        navigate(PATH.COMBINED_DETAIL(card.id, summaryId), {
                          state: { from: "project", ownerId },
                        });
                      } else {
                        navigate(
                          `${PATH.COMMUNITY_POST(card.id)}?${qs.toString()}`
                        );
                      }
                    }}
                  />
                ))}
            </div>
          )}
        </ProjectAccordion>
      )}
    </div>
  );
}
