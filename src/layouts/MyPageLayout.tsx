import MyPageSideBar from "@/widgets/mypage/MyPageSidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import useTroubleCards from "@/features/mypage/useTroubleCards";
import { useMemo, useState } from "react";
import { useViewerId } from "@/store/auth";
import { PATH } from "@/shared/config/paths";

const MyPageLayout = () => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const viewerId = useViewerId();
  const myUserIdStr = viewerId != null ? String(viewerId) : null;

  // id가 없으면 '내 마이페이지'로 간주
  const isMyPage = !id || (myUserIdStr != null && id === myUserIdStr);

  const [sortBy, setSortBy] = useState<"latest" | "important">("latest");

  // 숫자 id 계산 (타인 페이지일 때만 의미 있음)
  const userIdNum = useMemo(() => {
    if (!id) return NaN; // 내 페이지면 NaN
    const n = Number(id);
    return Number.isFinite(n) ? n : NaN;
  }, [id]);

  // 태그 선택 시 URL 생성 로직: 내/타인 분기
  const selectedTag = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const t = sp.get("tag");
    return t && t.trim() ? t : null;
  }, [location.search]);

  const handleSelectTag = (tag: string | null) => {
    const baseWithoutTab = isMyPage ? PATH.MYPAGE_BASE : PATH.MYPAGE_ID(id!);
    const targetBase = isMyPage ? `${baseWithoutTab}/troubles` : baseWithoutTab;
    const url = tag
      ? `${targetBase}?tag=${encodeURIComponent(tag)}`
      : targetBase;
    navigate(url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const source = useMemo(
    () =>
      isMyPage
        ? ({ type: "all", tag: selectedTag ?? undefined } as const)
        : ({
            type: "user",
            userId: userIdNum,
            tag: selectedTag ?? undefined,
          } as const),
    [isMyPage, userIdNum, selectedTag]
  );

  const enabled = isMyPage || Number.isFinite(userIdNum);

  const { cards, isLoading, error, hasNext, sentinelRef, reload } =
    useTroubleCards(source, {
      infinite: true,
      pageSize: 10,
      sortBy,
      enabled,
    });

  const isPublicCard = (c: any) =>
    c?.isVisible === true ||
    c?.visibility === "public" ||
    c?.raw?.isVisible === true;

  const cardsForView = useMemo(() => {
    return isMyPage ? cards : cards.filter(isPublicCard);
  }, [cards, isMyPage]);

  const visibleCards = useMemo(() => {
    if (!selectedTag) return cardsForView;
    return cardsForView.filter((c) =>
      Array.isArray(c.tags) ? c.tags.includes(selectedTag) : false
    );
  }, [cardsForView, selectedTag]);

  const counts = useMemo(() => {
    const mine = cards.filter((c) => c.isMine);

    const inProgress = mine.filter((c) => c.status === "inProgress").length;

    // created 중에서 요약본이 정말 존재하는 것만
    const created = mine.filter((c) => {
      if (c.status !== "created") return false;
      const summaries = Array.isArray(c.summaries) ? c.summaries : [];
      return summaries.length > 0;
    }).length;

    // complete = "원본만" + "요약본 없는 created"
    const complete = mine.filter((c) => {
      if (c.status === "complete") return true;
      if (c.status === "created") {
        const summaries = Array.isArray(c.summaries) ? c.summaries : [];
        return summaries.length === 0; // 요약본이 없으면 complete로 포함
      }
      return false;
    }).length;

    const all = inProgress + complete + created;

    return {
      all,
      inProgress,
      complete,
      created,
    };
  }, [cards]);

  const sortedTags = useMemo<[string, number][]>(() => {
    if (cardsForView.length === 0) return [];
    const counter = new Map<string, number>();
    for (const c of cardsForView) {
      if (!Array.isArray(c.tags)) continue;
      for (const raw of c.tags) {
        const tag = String(raw ?? "").trim();
        if (!tag) continue;
        counter.set(tag, (counter.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counter.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    );
  }, [cardsForView]);

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
      <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10 xl:gap-[68px]">
        <aside className="w-full md:w-[296px] flex-shrink-0">
          <MyPageSideBar
            {...(isMyPage
              ? { isMyPage: true as const, counts }
              : {
                  isMyPage: false as const,
                  sortedTags,
                  selectedTag,
                  onSelectTag: handleSelectTag,
                })}
          />
        </aside>

        <section className="flex-1 min-w-0 flex flex-col items-start">
          <Outlet
            context={{
              isMyPage,
              cards: visibleCards,
              isLoading,
              error,
              hasNext,
              sentinelRef,
              reload,
              sortBy,
              setSortBy,
              selectedTag,
            }}
          />
        </section>
      </div>
    </div>
  );
};

export default MyPageLayout;
