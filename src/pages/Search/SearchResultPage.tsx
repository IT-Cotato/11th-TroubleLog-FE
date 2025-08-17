import TroubleShootingCard from "@/components/MyPage/TroubleShootingCard";
import { PATH } from "@/constants/paths";
import { useInfiniteCommunityTroubleSearch } from "@/hooks/useInfiniteCommunityTroubleSearch";
import { useInfiniteMyTroubleSearch } from "@/hooks/useInfiniteMyTroubleSearch";
import { useInfiniteUserTroubleSearch } from "@/hooks/useInfiniteUserTroubleSearch";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SearchResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const sp = new URLSearchParams(location.search);
  const query = sp.get("query") ?? "";
  // scope: 화이트리스트로 안전하게 정규화
  type SearchScope = "my" | "mypage" | "user" | "community";
  const scopeRaw = sp.get("scope");
  const scope: SearchScope =
    scopeRaw === "my" ||
    scopeRaw === "mypage" ||
    scopeRaw === "user" ||
    scopeRaw === "community"
      ? scopeRaw
      : "community";
  // size: 1~50 범위로 클램프
  const sizeParam = Number(sp.get("size"));
  const size =
    Number.isFinite(sizeParam) && sizeParam >= 1 && sizeParam <= 50
      ? sizeParam
      : 10;
  // userId: 정수 문자열만 허용
  const userIdStr = sp.get("userId");
  const userId =
    userIdStr && /^\d+$/.test(userIdStr) ? Number(userIdStr) : null;

  const isMyScope = scope === "my" || scope === "mypage";
  const isUserScope = scope === "user" && !!userId;
  const isCommunityScope = scope === "community";

  const isBlocked = (card: any) => {
    const vis = String(card.visibility ?? "").toUpperCase(); // "PUBLIC" | "PRIVATE"
    const st = String(card.status ?? "").toUpperCase(); // "INPROGRESS" 등
    const mine = !!card.isMine;
    return vis === "PRIVATE" || (st === "INPROGRESS" && !mine);
  };

  // 현재 로그인한 사용자 트러블슈팅 문서 내 검색
  const my = useInfiniteMyTroubleSearch(
    isMyScope ? query : "",
    size,
    { isMine: true, authorName: "나", isSearchResult: true },
    { enabled: isMyScope }
  );

  // 특정 사용자 트러블슈팅 문서 내 검색
  const other = useInfiniteUserTroubleSearch(
    isUserScope ? query : "",
    userId,
    size
  );

  // 커뮤니티 게시글 검색
  const community = useInfiniteCommunityTroubleSearch(
    isCommunityScope ? query : "",
    size
  );

  // 활성 훅 선택
  const active = isUserScope ? other : isMyScope ? my : community;
  // 활성 훅이 바뀔 때 비교용 키(불필요한 재부착 방지)
  const activeKey = isUserScope
    ? `user:${userId}`
    : isMyScope
    ? "my"
    : "community";

  const loadingInitial = active.loadingInitial;
  const loadingMore = active.loadingMore;
  const error = active.error;
  const items = active.items;
  const totalElements = active.totalElements;
  const displayTotal = (active as any).displayTotal ?? totalElements;
  const hasNext = active.hasNext;

  // 하단 센티널 관찰자
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreRef = useRef<() => void>(() => {});
  useEffect(() => {
    loadMoreRef.current = active.loadMore;
  }, [active.loadMore]);

  useEffect(() => {
    const el = sentinelRef.current;

    // 센티널이 없거나 더 로드할 게 없으면 관찰 안 함
    if (!el || !hasNext) return;

    // 기존 옵저버 있으면 정리 (StrictMode/리렌더 대응)
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // 최신 loadMore 실행
          loadMoreRef.current?.();
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 }
    );

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [hasNext, activeKey, query, size]);

  // 별점 enum → 숫자 변환
  const parseStar = (raw: unknown) => {
    if (typeof raw === "number") return raw;
    if (typeof raw !== "string") return 0;
    const k = raw.toUpperCase();
    const map: Record<string, number> = {
      ONE_STAR: 1,
      TWO_STARS: 2,
      THREE_STARS: 3,
      FOUR_STARS: 4,
      FIVE_STARS: 5,
    };
    return map[k] ?? 0;
  };

  return (
    <div className="mt-[179px] mb-[68px] flex w-[1200px] flex-col items-start gap-[56px] mx-auto">
      <span className="text-head-32-regular self-stretch">
        {loadingInitial
          ? "검색 중…"
          : `총 ${displayTotal}개의 포스트를 찾았어요.`}
      </span>

      {/* 에러 */}
      {error && (
        <div className="text-red-600 text-body-16-regular">{error}</div>
      )}

      {/* 결과 리스트 */}
      <div className="flex flex-col items-start self-stretch">
        {loadingInitial && items.length === 0 ? (
          <>
            <div className="w-full h-[120px] bg-gray-100 rounded mb-3" />
            <div className="w-full h-[120px] bg-gray-100 rounded mb-3" />
          </>
        ) : items.length === 0 ? (
          <div className="text-gray-500 text-body-16-regular mt-4">
            검색 결과가 없습니다.
          </div>
        ) : (
          items.map((card) => {
            const blocked = isBlocked(card);
            const idNum =
              typeof card.id === "number"
                ? card.id
                : Number.parseInt(String(card.id), 10);
            const idValid = Number.isFinite(idNum);

            // 원본 검색 아이템
            const raw = card.raw; // (MyTroubleServerItem | undefined)
            const contents = raw?.contents ?? [];

            // 어떤 에디터로 갈지: 하나라도 USER_WRITTEN이 아니면 TEMPLATE
            const goFreeform = contents.every(
              (c) => (c.authorType ?? "USER_WRITTEN") === "USER_WRITTEN"
            );

            // FREEFORM 프리필 블록
            const freeformBlocks =
              contents
                .slice()
                .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                .map((c, i) => ({
                  id: c.id ?? i,
                  title: c.subTitle ?? "",
                  content: c.body ?? "",
                  isSaved: false,
                })) ?? [];

            // TEMPLATE 프리필 블록
            const templateBlocks =
              contents
                .slice()
                .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                .map((c, i) => ({
                  id: c.id ?? i,
                  content: c.body ?? "",
                  checklist: [],
                  checklistItems: [],
                  checklistTitle: c.subTitle ? `${c.subTitle} 체크리스트` : "",
                  question: c.subTitle ?? `질문 ${i + 1}`,
                  isSaved: false,
                })) ?? [];

            const prefillBase = {
              title: card.title,
              tags: card.tags,
              errorType: card.errorCategory || null,
              savePrefill: {
                importance: parseStar(raw?.starRating),
                visibility: card.visibility, // "public" | "private"
                projectId: raw?.projectId ?? null,
                projectName: undefined,
                thumbnail: raw?.thumbnailUrl ?? null,
              } as const,
            };

            return (
              <TroubleShootingCard
                key={card.id}
                {...card}
                // 클릭 막기: blocked 이거나 id가 유효하지 않으면 onClick 전달 안 함
                onClick={
                  blocked || !idValid
                    ? undefined
                    : () => {
                        // 안내 메시지
                        const ok = window.confirm(
                          goFreeform
                            ? "이 문서는 자유형식으로 작성된 글이에요.\n이어쓰기 화면으로 이동할까요?"
                            : "이 문서는 가이드 템플릿 기반으로 작성된 글이에요.\n이어쓰기 화면으로 이동할까요?"
                        );
                        if (!ok) return;

                        if (goFreeform) {
                          // FREEFORM 편집으로 이동 + 프리필
                          navigate(PATH.FREEFORM_WRITING, {
                            state: {
                              editorType: "FREEFORM",
                              ...prefillBase,
                              blocks: freeformBlocks, // FreeFormWritePage에서 그대로 반영
                            },
                          });
                        } else {
                          // TEMPLATE 편집으로 이동 + 프리필
                          navigate(PATH.TEMP_WRITING, {
                            state: {
                              editorType: "TEMPLATE",
                              ...prefillBase,
                              blocks: templateBlocks, // TempWritePage에서 그대로 반영
                            },
                          });
                        }
                      }
                }
                // TroubleShootingCard가 직접 처리할 수 있도록 명시적 disabled 전달
                disabled={blocked || !idValid}
              />
            );
          })
        )}

        {/* 로딩 인디케이터 / 센티널 */}
        <div className="w-full flex flex-col items-center mt-4">
          {loadingMore && (
            <div className="w-full h-[120px] bg-gray-100 rounded mb-3" />
          )}
          {/* 이 div가 뷰포트에 들어오면 다음 페이지 로드 시도 */}
          {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}
        </div>
      </div>
    </div>
  );
};

export default SearchResultPage;
