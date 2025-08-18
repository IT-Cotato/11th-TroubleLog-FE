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

type VisibilityOption = "전체" | "공개" | "비공개";
type StatusType = "complete" | "created";
type SortUI = "latest" | "important";

export default function ProjectDetailPage() {
  const { id: routeProjectId } = useParams<{ id: string }>();
  const projectId = Number(routeProjectId);
  const isInvalid = Number.isNaN(projectId);

  // 라우팅 시 폴더 카드에서 넘겨준 이름 사용, 없으면 api로 조회
  const location = useLocation() as { state?: { projectName?: string } };
  const [projectName, setProjectName] = useState<string>(
    location.state?.projectName ?? "프로젝트"
  );
  const [titleLoading, setTitleLoading] = useState(
    !location.state?.projectName && !isInvalid
  );

  const hasProjectName = Boolean(location.state?.projectName);

  // 글쓰기 버튼 드롭다운
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

  // 글쓰기 드롭다운 버튼 클릭 핸들러
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
        //  const { content } = await getProjectList();
        // const found = content.find((p) => p.id === projectId);
        // if (found) setProjectName(found.name);
      } finally {
        setTitleLoading(false);
      }
    })();
  }, [projectId, isInvalid, hasProjectName]);

  // UI 필터 상태
  const visibilityOptions: VisibilityOption[] = ["전체", "공개", "비공개"];
  const [selectedStatus, setSelectedStatus] = useState<StatusType>("complete");
  const [selectedSort, setSelectedSort] = useState<SortUI>("latest");
  const [selectedVisibility, setSelectedVisibility] =
    useState<VisibilityOption>("전체");
  const [selectedSummaryType, setSelectedSummaryType] =
    useState<ProjectTroubleSummaryType | null>(null);

  // UI-서버 파라미터 매핑
  const toApiStatus = (s: StatusType) =>
    s === "complete" ? "COMPLETED" : ("SUMMARIZED" as const);
  const toApiSort = (s: SortUI) =>
    s === "latest" ? "LATEST" : ("LIKES" as const);
  const toApiVisibility = (v: VisibilityOption) =>
    v === "공개" ? "PUBLIC" : v === "비공개" ? "PRIVATE" : "ALL";

  // 서버 쿼리 결정 (상태/정렬은 항상 포함)
  const query: ProjectTroubleQuery = useMemo(() => {
    const base: ProjectTroubleQuery = {
      status: toApiStatus(selectedStatus),
      sort: toApiSort(selectedSort),
    };
    if (selectedStatus === "complete") {
      // 작성 완료 → 공개 범위 사용 (전체/공개/비공개)
      if (selectedVisibility !== "전체") {
        base.visibility = toApiVisibility(selectedVisibility);
      }
    } else {
      // 요약 유형만
      if (selectedSummaryType) {
        base.summaryType = selectedSummaryType; // 바로 enum 값
      }
    }
    return base;
  }, [selectedStatus, selectedSort, selectedVisibility, selectedSummaryType]);

  const troubleParams = useMemo(
    () => ({ type: "project" as const, projectId, query }),
    [projectId, query]
  );

  const troubleOpts = useMemo(() => ({ enabled: !isInvalid }), [isInvalid]);

  // 프로젝트별 트러블슈팅 목록 로드
  const { cards, isLoading, error } = useTroubleCards(
    troubleParams,
    troubleOpts
  );

  return (
    <div className="flex w-full px-[156px] pt-[79px] pb-[158px] flex-col items-start gap-[36px]">
      {/* 상단 나의 프로젝트 텍스트 및 글쓰기 버튼 */}
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
      {/* 프로젝트 아코디언 영역 */}
      {isInvalid ? (
        <div className="w-full flex h-[220px] justify-center items-center rounded-[16px] bg-white shadow-card">
          <span className="text-body-20-regular">
            잘못된 프로젝트 주소입니다.
          </span>
        </div>
      ) : (
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
          ) : cards.length === 0 ? (
            <div className="w-full flex h-[220px] justify-center items-center rounded-[16px] bg-white shadow-card">
              <span className="text-body-20-regular">
                아직 작성된 트러블슈팅이 없어요.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center sm:justify-start gap-[24px] w-full">
              {cards.map((card) => (
                <TroublogCard key={card.id} {...card} />
              ))}
            </div>
          )}
        </ProjectAccordion>
      )}
    </div>
  );
}
