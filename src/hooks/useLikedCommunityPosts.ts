import { useCallback, useEffect, useRef, useState } from "react";
import { getLikedCommunityPosts } from "@/api/community.api";
import { toLikedCards } from "@/mappers/likedPosts.mapper";
import type { TroubleShootingCardProps } from "@/components/MyPage/TroubleShootingCard";

const inflight = new Map<string, Promise<any>>();

const keyOf = (p: number, s: number) => `likes|p=${p}|s=${s}`;

async function fetchOnce(page1: number, size: number) {
  const key = keyOf(page1, size);
  if (!inflight.has(key)) {
    const p = getLikedCommunityPosts(page1, size).finally(() =>
      inflight.delete(key)
    );
    inflight.set(key, p);
  }
  return inflight.get(key)!;
}

export default function useLikedCommunityPosts(pageSize = 10) {
  const [items, setItems] = useState<TroubleShootingCardProps[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 옵저버/중복 호출 방지용
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  const hasNextRef = useRef(false);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    hasNextRef.current = hasNext;
  }, [hasNext]);

  const loadPage = useCallback(
    async (targetPage1: number, append = true) => {
      if (loadingRef.current) return;

      setLoading(true);
      setError(null);
      try {
        const resp = await fetchOnce(targetPage1, pageSize);
        const mapped = toLikedCards(resp.content ?? []);

        if (!append || targetPage1 === 1) {
          setItems(mapped);
        } else {
          setItems((prev) => prev.concat(mapped));
        }

        setPage(targetPage1);
        // 서버 메타 우선 사용, 없으면 길이 기준
        const next =
          typeof resp.hasNext === "boolean"
            ? resp.hasNext
            : (resp.content ?? []).length >= pageSize;
        setHasNext(next);
      } catch (e: any) {
        setError(e?.message ?? "불러오기 실패");
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  // 초기 로드
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasNext(false);
    setError(null);
    void loadPage(1, false);
  }, [loadPage]);

  // 무한 스크롤
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNext) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) return;
        if (loadingRef.current) return;
        if (!hasNextRef.current) return;
        void loadPage(page + 1, true);
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 }
    );
    observerRef.current.observe(el);

    return () => observerRef.current?.disconnect();
  }, [page, hasNext, loadPage]);

  // 외부에서 삭제 시 목록 갱신용
  const removeById = useCallback((postId: number) => {
    setItems((prev) => prev.filter((c) => Number(c.id) !== postId));
  }, []);

  return {
    items,
    loading,
    error,
    hasNext,
    sentinelRef,
    reload: () => loadPage(1, false),
    removeById,
  };
}
