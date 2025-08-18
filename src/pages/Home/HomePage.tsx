import { useState, useCallback, useEffect, useRef } from "react";
import PostButton from "@/components/Button/PostButton";
import Snackbar from "@/components/Feedback/Snackbar";
import TroublogCard from "@/components/Card/TroublogCard";
import ProjectAccordion from "@/components/Project/ProjectAccordion";
import ProjectFolderCard from "@/components/Project/ProjectFolderCard";
import FolderModal from "@/components/Modal/FolderModal";
import useClickOutside from "@/hooks/useClickOutside";
import { getProjectList, postCreateProject } from "@/api/project.api";
import type {
  ProjectListItem,
  CreateProjectRequest,
} from "@/types/project.model";
import useTroubleCards from "@/hooks/useTroubleCards";
import { PATH } from "@/constants/paths";
import { useNavigate } from "react-router-dom";
import plusIcon from "@/assets/icons/plus.svg";
import { useViewerId } from "@/store/auth";

const PAGE_SIZE = 10;

// StrictMode 중복/동시 호출 방지: 페이지별 in-flight Promise 공유
type ProjectPageResp = {
  content: ProjectListItem[];
  hasNext?: boolean;
  isLast?: boolean;
  totalPages?: number;
  totalElements?: number;
  page?: number;
  size?: number;
};

const inflight = new Map<string, Promise<ProjectPageResp>>();

function fetchPageOnce(page: number, size: number) {
  const key = `${page}:${size}`;
  if (!inflight.has(key)) {
    const p = getProjectList(page, size).finally(() => inflight.delete(key));
    inflight.set(key, p);
  }

  return inflight.get(key)!;
}

export default function HomePage() {
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [removedRecentIds, setRemovedRecentIds] = useState<Set<number>>(
    new Set()
  );

  const navigate = useNavigate();

  const viewerId = useViewerId();

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

  // 프로젝트 목록 + 페이징 상태
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);

  // 최신 상태를 콜백에서 안전히 읽기 위한 ref들
  const isLoadingRef = useRef(false);
  const hasNextRef = useRef(false);
  const pageRef = useRef(1);
  const fetchingRef = useRef(false); // 중복 실행 락

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  useEffect(() => {
    hasNextRef.current = hasNext;
  }, [hasNext]);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // 트러블슈팅 목록 불러오기
  const {
    cards: recentCards,
    isLoading: isLoadingRecents,
    error: recentsError,
    hasNext: hasNextRecents,
    sentinelRef: recentsSentinel,
    reload: recentsReload,
  } = useTroubleCards(
    { type: "all" },
    { infinite: true, pageSize: 10, sortBy: "latest" }
  );

  // 센티널(관찰 대상) 참조
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 중복 추가 방지용 id 집합(옵션)
  const idSetRef = useRef<Set<number>>(new Set());

  // 페이지 로딩 함수(append)
  const loadPage = useCallback(
    async (nextPage: number, { append = true, useOnce = true } = {}) => {
      if (isLoadingRef.current) return; // 직전 로딩 중이면 무시
      if (!hasNextRef.current && nextPage !== 1) return; // 더 없는데 추가 요청이면 무시

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
          // 전체 초기화
          idSetRef.current = new Set(list.map((x) => x.id));
          setProjects(list);
        } else {
          // 중복 방지하며 이어 붙이기
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
    []
  );

  // 최초 1페이지 로딩
  useEffect(() => {
    loadPage(1, { append: false, useOnce: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의도적으로 초기 로드만 수행

  // IntersectionObserver로 다음 페이지 자동 로드
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (fetchingRef.current) return;
        if (!hasNextRef.current) return;
        if (isLoadingRef.current) return;

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
        rootMargin: "300px 0px", // 너무 일찍 당기면 연속 호출됨 → 300px 정도 권장
        threshold: 0,
      }
    );

    io.observe(el);
    return () => io.disconnect();
    // 의존성 없음: 최초 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 새 프로젝트 생성 후 목록 리셋(1페이지부터 다시)
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

      // 목록 초기화 후 1페이지 재조회
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

  // 프로젝트 폴더 카드 수정/삭제 후 현재 목록 갱신(1페이지부터 새로)
  const handleCardUpdated = useCallback(() => {
    void loadPage(1, { append: false, useOnce: false });
  }, [loadPage]);

  // 프로젝트 폴더 삭제 후 목록 갱신
  const handleCardDeleted = useCallback(() => {
    (async () => {
      // 프로젝트 목록 갱신
      await loadPage(1, { append: false, useOnce: false });
      // Recents 갱신
      try {
        await recentsReload?.();
      } catch (e) {
        console.error("Recents reload failed", e);
      }
      // 삭제 필터 상태 초기화
      setRemovedRecentIds(new Set());
    })();
  }, [loadPage, recentsReload]);

  // 트러블슈팅 카드 삭제 후 목록 갱신
  const handleRecentDeleted = useCallback((postId: number) => {
    setRemovedRecentIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
  }, []);

  return (
    <div className="flex px-[156px] pt-[79px] pb-[158px] flex-col items-start gap-[40px]">
      {/* 상단 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <span className="text-head-32-regular">나의 프로젝트</span>
        <div className="relative">
          {/* 폴더가 없을 경우 */}
          {showSnackbar && (
            <div className="absolute top-[-60px] right-0">
              <Snackbar message="프로젝트 폴더를 먼저 생성해주세요." />
            </div>
          )}
          <PostButton onClick={handlePostClick} />
          {/* 글쓰기 템플릿 선택 (폴더 있는 경우) */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-1/2 translate-x-[-50%] mt-[8px] w-[184px] rounded-[8px] shadow-card bg-subColor2"
            >
              <button
                type="button"
                onClick={handleGoGuideTemplate}
                className="flex w-full pt-[8px] pb-[9px] justify-center items-center border-0.5px border-b border-gray2 text-body-16-regular"
              >
                가이드 템플릿
              </button>
              <button
                type="button"
                onClick={handleGoFreeformTemplate}
                className="flex w-full pt-[8px] pb-[9px] justify-center items-center border-0.5px border-b border-gray2 text-body-16-regular"
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
            <img src={plusIcon} alt="plus" className="w-[36px] h-[36px]" />
          </button>
        }
      >
        {/* 목록/로딩/에러 */}
        {isLoading && projects.length === 0 ? (
          <div className="w-full flex h-[132px] justify-center items-center rounded-[8px] bg-white shadow-card">
            <span className="text-body-20-regular">불러오는 중...</span>
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
              아직 요약하신 폴더가 없어요.
            </span>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-[24px] self-stretch">
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
          <div className="w-full flex h-[330px] justify-center items-center rounded-[16px] bg-white shadow-card">
            <span className="text-body-20-regular">불러오는 중…</span>
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
            <div className="flex flex-wrap gap-[24px]">
              {recentCards
                .filter((c) => !removedRecentIds.has(c.id))
                .map((card) => (
                  <TroublogCard
                    key={card.id}
                    {...card}
                    onDeleted={handleRecentDeleted}
                    onClick={() => {
                      const ownerId = card.authorId ?? viewerId;
                      const qs = new URLSearchParams({ from: "home" });
                      if (ownerId != null) qs.set("ownerId", String(ownerId));
                      navigate(
                        `${PATH.COMMUNITY_POST(card.id)}?${qs.toString()}`
                      );
                    }}
                    onAvatarClick={() => {
                      if (viewerId != null)
                        navigate(PATH.MYPAGE(String(viewerId)));
                      else navigate(PATH.LOGIN);
                    }}
                  />
                ))}
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

      {/* 모달 표시 */}
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
