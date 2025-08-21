import MyPageSideBar from "@/components/MyPage/MyPageSidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import useTroubleCards from "@/hooks/useTroubleCards";
import { useMemo, useState } from "react";
import { useViewerId } from "@/store/auth";
import { PATH } from "@/constants/paths";

const MyPageLayout = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const viewerId = useViewerId();
  const myUserIdStr = viewerId != null ? String(viewerId) : null;

  const myUserId = typeof window !== "undefined" ? myUserIdStr : null;
  const isMyPage = !!myUserId && id === myUserId;

  const [sortBy, setSortBy] = useState<"latest" | "important">("latest");

  const userIdNum = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : NaN;
  }, [id]);

  const selectedTag = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const t = sp.get("tag");
    return t && t.trim() ? t : null;
  }, [location.search]);

  const handleSelectTag = (tag: string | null) => {
    if (!id) return;
    const url = tag
      ? `${PATH.MYPAGE(id)}?tag=${encodeURIComponent(tag)}`
      : PATH.MYPAGE(id);
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
    return {
      all: mine.length,
      inProgress: mine.filter((c) => c.status === "inProgress").length,
      complete: mine.filter((c) => c.status === "complete").length,
      created: mine.filter((c) => c.status === "created").length,
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
