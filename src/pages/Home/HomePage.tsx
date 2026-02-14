import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import PostButton from "@/shared/ui/Button/PostButton";
import Snackbar from "@/shared/ui/Feedback/Snackbar";
import TroublogCard from "@/entities/trouble/ui/TroublogCard";
import ProjectAccordion from "@/entities/project/ui/ProjectAccordion";
import ProjectFolderCard from "@/entities/project/ui/ProjectFolderCard";
import FolderModal from "@/shared/ui/Modal/FolderModal";
import useClickOutside from "@/hooks/useClickOutside";
import { getProjectList, postCreateProject } from "@/api/project.api";
import type {
  ProjectListItem,
  CreateProjectRequest,
} from "@/types/project.model";
import useTroubleCards from "@/features/mypage/useTroubleCards";
import { PATH } from "@/shared/config/paths";
import { useNavigate } from "react-router-dom";
import plusIcon from "@/assets/icons/plus.svg";
import { useAuthHydrated, useIsLoggedIn, useViewerId } from "@/store/auth";
import { decideCombined } from "@/entities/trouble/lib/combinedRoute";
import { makePostSlug } from "@/shared/lib/slug";
import { CardListSkeleton } from "@/shared/ui/LoadingSkeleton";
import { mapSummaryType } from "@/entities/trouble/lib/troubleMapping";

const PAGE_SIZE = 10;

type ProjectPageResp = {
  content: ProjectListItem[];
  hasNext?: boolean;
  isLast?: boolean;
  totalPages?: number;
  totalElements?: number;
  page?: number;
  size?: number;
};

export default function HomePage() {
  const hydrated = useAuthHydrated();
  const isLoggedIn = useIsLoggedIn();
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [removedRecentIds, setRemovedRecentIds] = useState<Set<number>>(
    new Set()
  );

  const navigate = useNavigate();
  const viewerId = useViewerId();

  const inflight = new Map<string, Promise<ProjectPageResp>>();

  function fetchPageOnce(page: number, size: number) {
    const key = `${page}:${size}`;
    if (!inflight.has(key)) {
      const p = getProjectList(page, size).finally(() => inflight.delete(key));
      inflight.set(key, p);
    }

    return inflight.get(key)!;
  }

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

  // 프로젝트 목록 + 페이징 상태
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);

  const isLoadingRef = useRef(false);
  const hasNextRef = useRef(false);
  const pageRef = useRef(1);
  const fetchingRef = useRef(false);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  useEffect(() => {
    hasNextRef.current = hasNext;
  }, [hasNext]);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const {
    cards: recentCards,
    isLoading: isLoadingRecents,
    error: recentsError,
    hasNext: hasNextRecents,
    sentinelRef: recentsSentinel,
    reload: recentsReload,
  } = useTroubleCards(
    { type: "all" },
    {
      infinite: true,
      pageSize: 10,
      sortBy: "latest",
      enabled: hydrated && isLoggedIn,
    }
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const idSetRef = useRef<Set<number>>(new Set());

  const expandedRecentCards = useMemo(() => {
    // 먼저 삭제된 카드(postId 기준)는 모두 제외
    const base = recentCards.filter((c) => !removedRecentIds.has(c.id));
    const result: any[] = [];

    for (const card of base) {
      const summaries = Array.isArray((card as any).summaries)
        ? (card as any).summaries
        : [];
      const hasSummaries = summaries.length > 0;
      const originalStatus =
        card.status === "created" ? "complete" : card.status;

      // 1) 작성중(inProgress): "작성중(클릭 시 이어서 작성)"
      if (card.status === "inProgress") {
        result.push({
          ...card,
          _kind: "draft", // 작성중
        });
        continue;
      }

      // 2) 요약본이 하나도 없는 원본
      //    → "원본(요약 전)" 1개만
      if (!hasSummaries) {
        result.push({
          ...card,
          status: originalStatus, // SUMMARIZED 이면서 요약본이 없는 경우도 완료로 처리
          _kind: "original", // 원본(요약 전)
        });
        continue;
      }

      // 3) 요약본이 있는 포스트(status: created)
      //    - 원본(요약 후) 1개 (작성 완료 표시, 요약 타입 표시는 제거)
      //    - 원본+요약본 N개 (요약 타입 표시, 상태는 created)
      result.push({
        ...card,
        status: originalStatus,
        summaryType: undefined,
        _kind: "original", // 원본(요약 후)
      });

      for (const summary of summaries) {
        const summaryTypeLabel =
          mapSummaryType(summary.summaryType) ?? card.summaryType;

        const common = {
          ...card,
          summaryId: summary.summaryId,
          summaryType: summaryTypeLabel,
          summaryCreatedAt: summary.summaryCreatedAt,
          summary,
          status: "created",
        };

        result.push({
          ...common,
          _kind: "combined", // 원본+요약본
        });
      }
    }

    return result;
  }, [recentCards, removedRecentIds]);

  const loadPage = useCallback(
    async (nextPage: number, { append = true, useOnce = true } = {}) => {
      if (!hydrated || !isLoggedIn) return; // 안전망
      if (isLoadingRef.current) return;
      if (!hasNextRef.current && nextPage !== 1) return;

      setIsLoading(true);
      setLoadError(null);
      try {
        const res = useOnce
          ? await fetchPageOnce(nextPage, PAGE_SIZE)
          : await getProjectList(nextPage, PAGE_SIZE);

        const pageHasNext =
          res.hasNext ?? (res.isLast !== undefined ? !res.isLast : false);
        const list = Array.isArray(res.content) ? res.content : [];

        setHasNext(pageHasNext);
        setPage(nextPage);

        if (!append || nextPage === 1) {
          idSetRef.current = new Set(list.map((x) => x.id));
          setProjects(list);
        } else {
          const acc: ProjectListItem[] = [];
          for (const item of list) {
            if (!idSetRef.current.has(item.id)) {
              idSetRef.current.add(item.id);
              acc.push(item);
            }
          }
          setProjects((prev) => prev.concat(acc));
        }
      } catch (e) {
        setLoadError(e);
      } finally {
        setIsLoading(false);
      }
    },
    [hydrated, isLoggedIn]
  );

  useEffect(() => {
    if (!hydrated || !isLoggedIn) return;
    loadPage(1, { append: false, useOnce: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isLoggedIn]);

  useEffect(() => {
    if (!hydrated || !isLoggedIn) return;
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (fetchingRef.current) return;
        if (!hasNextRef.current) return;
        if (isLoadingRef.current) return;
        if (!hydrated || !isLoggedIn) return;

        fetchingRef.current = true;
        void loadPage(pageRef.current + 1, {
          append: true,
          useOnce: true,
        }).finally(() => {
          fetchingRef.current = false;
        });
      },
      {
        root: null,
        rootMargin: "300px 0px",
        threshold: 0,
      }
    );

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isLoggedIn]);

  const handleCreateProject = async (data: CreateProjectRequest) => {
    try {
      setCreating(true);

      const payload: CreateProjectRequest = {
        name: data.name,
        description: data.description,
        ...(data.thumbnailImageUrl && data.thumbnailImageUrl.trim() !== ""
          ? { thumbnailImageUrl: data.thumbnailImageUrl }
          : {}),
      };

      await postCreateProject(payload);

      setProjects([]);
      idSetRef.current = new Set();
      setPage(1);
      setHasNext(false);
      await loadPage(1, { append: false, useOnce: false });

      alert("프로젝트가 생성되었습니다!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("프로젝트 생성 실패", error);
      alert("프로젝트 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const handlePostClick = useCallback(() => {
    if (projects.length === 0) {
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 1000);
    } else {
      setShowDropdown((prev) => !prev);
    }
  }, [projects.length]);

  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);
  const dropdownRef = useClickOutside(() => setShowDropdown(false));

  const handleCardUpdated = useCallback(() => {
    void loadPage(1, { append: false, useOnce: false });
  }, [loadPage]);

  const handleCardDeleted = useCallback(() => {
    (async () => {
      await loadPage(1, { append: false, useOnce: false });
      try {
        await recentsReload?.();
      } catch (e) {
        console.error("Recents reload failed", e);
      }
      setRemovedRecentIds(new Set());
    })();
  }, [loadPage, recentsReload]);

  const handleRecentDeleted = useCallback((postId: number) => {
    setRemovedRecentIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
  }, []);

  return (
    <div className="page-container pt-16 pb-40 flex flex-col gap-10">
      {/* 상단 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <span className="text-head-32-regular">나의 프로젝트</span>
        <div className="relative self-stretch sm:self-auto">
          {showSnackbar && (
            <div className="absolute -top-14 right-0">
              <Snackbar message="프로젝트 폴더를 먼저 생성해주세요." />
            </div>
          )}
          <PostButton onClick={handlePostClick} />
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full right-0 mt-2 w-[140px] rounded-[8px] shadow-card bg-subColor2"
            >
              <button
                type="button"
                onClick={handleGoGuideTemplate}
                className="flex w-full py-2.5 justify-center items-center border-0.5px text-body-16-regular"
              >
                가이드 템플릿
              </button>
              <button
                type="button"
                onClick={handleGoFreeformTemplate}
                className="flex w-full py-2.5 justify-center items-center text-body-16-regular"
              >
                자유 템플릿
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project Folders 영역 */}
      <ProjectAccordion
        title="Project Folders"
        persistKey="home:project-folders"
        headerExtra={
          <button
            type="button"
            onClick={handleOpenModal}
            aria-label="새 폴더 추가"
          >
            <img src={plusIcon} alt="plus" className="w-9 h-9" />
          </button>
        }
      >
        {isLoading && projects.length === 0 ? (
          <div className="w-full flex flex-wrap gap-6">
            <CardListSkeleton count={3} />
          </div>
        ) : loadError ? (
          <div className="w-full flex h-[132px] justify-center items-center rounded-[8px] bg-white shadow-card">
            <span className="text-body-20-regular text-red-500">
              목록 로드 실패
            </span>
          </div>
        ) : projects.length === 0 ? (
          <div className="w-full flex h-[132px] justify-center items-center self-stretch rounded-[8px] bg-white shadow-card">
            <span className="text-body-20-regular">
              아직 생성하신 폴더가 없어요.
            </span>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-6">
              {projects.map((p) => (
                <ProjectFolderCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  description={p.description}
                  thumbnail={p.thumbnailImageUrl}
                  tags={p.tags}
                  onUpdated={handleCardUpdated}
                  onDeleted={handleCardDeleted}
                  to={PATH.PROJECT_DETAIL(String(p.id))}
                  linkState={{ projectName: p.name }}
                />
              ))}
            </div>

            {/* 무한스크롤 센티널 + 하단 로딩 표시 */}
            {hasNext && !isLoading && (
              <div ref={sentinelRef} className="h-6 w-full" />
            )}

            <div className="w-full flex justify-center items-center mt-3">
              {isLoading && projects.length > 0 && (
                <span className="text-body-14-regular text-gray-500">
                  더 불러오는 중…
                </span>
              )}
            </div>
          </>
        )}
      </ProjectAccordion>

      {/* Recents 영역 */}
      <ProjectAccordion title="Recents" persistKey="home:recents">
        {isLoadingRecents && recentCards.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
            <CardListSkeleton count={4} />
          </div>
        ) : recentsError ? (
          <div className="w-full flex h-[330px] justify-center items-center rounded-[16px] bg-white shadow-card">
            <span className="text-body-20-regular text-red-500">
              목록 로드 실패
            </span>
          </div>
        ) : recentCards.length === 0 ? (
          <div className="w-full flex h-[330px] justify-center items-center rounded-[16px] bg-white shadow-card">
            <span className="text-body-20-regular">
              아직 확인한 트러블슈팅이 없어요.
            </span>
          </div>
        ) : (
          <>
            {/* 1 / 2 / 3 / 4 컬럼 그리드 (카드 4개 한 줄 기준) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
              {expandedRecentCards.map((card) => {
                const kind = (card as any)._kind as
                  | "draft"
                  | "original"
                  | "combined"
                  | undefined;

                return (
                  <TroublogCard
                    key={`${card.id}-${kind ?? "default"}-${
                      card.summaryId ?? "none"
                    }`}
                    {...card}
                    compact
                    onDeleted={handleRecentDeleted}
                    onClick={() => {
                      const ownerId = card.authorId ?? undefined;

                      // 작성중 카드: 이어서 작성하기 (템플릿에 맞게 수정 가능)
                      if (kind === "draft") {
                        // TODO: 실제 이어쓰기 라우팅 규칙에 맞게 조정
                        navigate(PATH.TEMP_WRITING, {
                          state: {
                            from: "home",
                            projectId: card.projectId,
                            postId: card.id,
                          },
                        });
                        return;
                      }

                      // 공통 쿼리스트링
                      const qs = new URLSearchParams({ from: "home" });
                      if (ownerId != null) qs.set("ownerId", String(ownerId));

                      // 목록 VM에서 확정값 추출
                      const statusFromList = card.status; // 'inProgress' | 'complete' | 'created'
                      const isVisibleFromList = card.visibility === "public"; // boolean
                      const summaryIdFromList = card.summaryId ?? undefined;
                      const isMineFromList = card.isMine === true;

                      // 원본+요약본 카드: 합본 상세로 이동
                      if (kind === "combined") {
                        const { goCombined, summaryId } = decideCombined(
                          card,
                          viewerId
                        );
                        const sid = summaryId ?? summaryIdFromList;

                        if (goCombined && sid != null) {
                          navigate(PATH.COMBINED_DETAIL(card.id, sid), {
                            state: { from: "home", ownerId },
                          });
                          return;
                        }

                        // 합본 불가하면 요약 상세로 폴백
                        if (summaryIdFromList != null) {
                          navigate(PATH.POST_SUMMARY(summaryIdFromList), {
                            state: { from: "home", ownerId },
                          });
                          return;
                        }
                      }

                      // 나머지(원본, 기타)는 항상 원본 상세로 이동
                      const slug = makePostSlug(card.title, card.id);
                      navigate(
                        `${PATH.COMMUNITY_POST_SLUG(slug)}?${qs.toString()}`,
                        {
                          state: {
                            from: "home",
                            ownerId,
                            statusFromList,
                            isVisibleFromList,
                            summaryIdFromList,
                            isMineFromList,
                          },
                        }
                      );
                    }}
                    onAvatarClick={() => {
                      if (viewerId != null) navigate(PATH.MYPAGE_BASE);
                      else navigate(PATH.LOGIN);
                    }}
                  />
                );
              })}
            </div>
            {hasNextRecents && !isLoadingRecents && (
              <div ref={recentsSentinel} className="h-6 w-full" />
            )}
            <div className="w-full flex justify-center mt-2">
              {isLoadingRecents && recentCards.length > 0 && (
                <span className="text-gray-500">더 불러오는 중…</span>
              )}
            </div>
          </>
        )}
      </ProjectAccordion>

      {isModalOpen && (
        <FolderModal
          mode="new"
          onClose={handleCloseModal}
          onSubmit={handleCreateProject}
          loading={creating}
        />
      )}
    </div>
  );
}
