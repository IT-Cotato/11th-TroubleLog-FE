import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { searchMyTroubles } from "@/api/trouble.api";
import type {
  MyTroublesServerPage,
  MyTroubleServerItem,
} from "@/types/troubles.server";
import type { TroubleShootingCardProps } from "@/components/MyPage/TroubleShootingCard";
import { toTroubleShootingCard } from "@/mappers/trouble.list-to-ts-card";

export interface UseInfiniteMyTroubleSearchOptions {
  isMine?: boolean;
  authorName?: string;
  isSearchResult?: boolean;
}

export function useInfiniteMyTroubleSearch(
  keyword: string,
  size = 10,
  options?: UseInfiniteMyTroubleSearchOptions
) {
  const opt = useMemo(
    () => ({
      isMine: options?.isMine ?? true,
      authorName: options?.authorName ?? "나",
      isSearchResult: options?.isSearchResult ?? true,
    }),
    [options?.isMine, options?.authorName, options?.isSearchResult]
  );

  const [items, setItems] = useState<TroubleShootingCardProps[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 중복 호출 방지 락
  const inflightRef = useRef(false);
  const lastKeyRef = useRef<string>("");

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasNext(false);
    setTotalElements(0);
    setTotalPages(0);
    setError(null);
    lastKeyRef.current = "";
  }, []);

  const fetchPage = useCallback(
    async (p: number, isFirst = false) => {
      if (inflightRef.current) return;

      const key = `${keyword}::${p}::${size}`;
      if (key === lastKeyRef.current) return; // 같은 요청 반복 방지
      lastKeyRef.current = key;

      inflightRef.current = true;
      try {
        if (isFirst) setLoadingInitial(true);
        else setLoadingMore(true);

        const res = await searchMyTroubles({
          keyword,
          page: Math.max(1, p),
          size,
        });

        const safe: MyTroublesServerPage = res ?? {
          content: [],
          hasNext: false,
          totalPages: 0,
          totalElements: 0,
          page: p,
          size,
          isFirst: p === 1,
          isLast: true,
        };

        const mapped = (safe.content as MyTroubleServerItem[]).map((it) =>
          toTroubleShootingCard(it, opt)
        );

        // 중복 제거 병합 (id 기준)
        setItems((prev) => {
          const map = new Map<string, TroubleShootingCardProps>();
          for (const it of prev) map.set(it.id, it);
          for (const it of mapped) map.set(it.id, it);
          return Array.from(map.values());
        });

        setPage(safe.page);
        setHasNext(safe.hasNext);
        setTotalElements(safe.totalElements);
        setTotalPages(safe.totalPages);
      } catch (e: any) {
        setError(e?.message ?? "내 트러블슈팅 검색 실패");
      } finally {
        if (isFirst) setLoadingInitial(false);
        else setLoadingMore(false);
        inflightRef.current = false;
      }
    },
    [keyword, size, opt.isMine, opt.authorName, opt.isSearchResult]
  );

  // 키워드/사이즈/옵션 변경 시 초기 1페이지 로드
  useEffect(() => {
    if (!keyword.trim()) {
      reset();
      return;
    }
    reset();
    void fetchPage(1, true);
  }, [
    keyword,
    size,
    opt.isMine,
    opt.authorName,
    opt.isSearchResult,
    reset,
    fetchPage,
  ]);

  const loadMore = useCallback(() => {
    if (!keyword.trim()) return;
    if (loadingMore || loadingInitial) return;
    if (!hasNext) return;
    if (inflightRef.current) return;
    void fetchPage(page + 1, false);
  }, [keyword, hasNext, page, loadingMore, loadingInitial, fetchPage]);

  return {
    items,
    loadingInitial,
    loadingMore,
    error,
    hasNext,
    totalElements,
    totalPages,
    loadMore,
    reset,
  };
}
