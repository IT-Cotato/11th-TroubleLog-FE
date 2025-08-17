import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { searchMyTroubles } from "@/api/trouble.api";
import type {
  MyTroubleSearchPage,
  TroubleSearchCard,
} from "@/types/troubles.server";
import type { TroubleShootingCardProps } from "@/components/MyPage/TroubleShootingCard";
import { toTroubleShootingCard } from "@/mappers/trouble.list-to-ts-card";

export interface UseInfiniteMyTroubleSearchOptions {
  isMine?: boolean;
  authorName?: string;
  isSearchResult?: boolean;
}

type Fetcher = (args: {
  keyword: string;
  page: number; // 1-based 요청
  size: number;
}) => Promise<MyTroubleSearchPage | null>;

interface Ext {
  fetcher?: Fetcher;
  filterItem?: (x: TroubleSearchCard) => boolean; // 여기도 카드 타입으로
  enabled?: boolean;
}

export function useInfiniteMyTroubleSearch(
  keyword: string,
  size = 10,
  options?: UseInfiniteMyTroubleSearchOptions,
  ext?: Ext
) {
  const opt = useMemo(
    () => ({
      isMine: options?.isMine ?? true,
      authorName: options?.authorName ?? "나",
      isSearchResult: options?.isSearchResult ?? true,
    }),
    [options?.isMine, options?.authorName, options?.isSearchResult]
  );

  // /my/search 반환 타입에 맞춘 Fetcher
  const fetcher: Fetcher = useMemo(
    () => ext?.fetcher ?? ((args) => searchMyTroubles(args)),
    [ext?.fetcher]
  );
  const enabled = ext?.enabled ?? true;

  // filterItem은 ref로 유지
  const filterRef = useRef<Ext["filterItem"]>(ext?.filterItem);
  useEffect(() => {
    filterRef.current = ext?.filterItem;
  }, [ext?.filterItem]);

  const [items, setItems] = useState<TroubleShootingCardProps[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 내부 page는 1-based
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [displayTotal, setDisplayTotal] = useState(0);

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
    setDisplayTotal(0);
  }, []);

  const fetchPage = useCallback(
    async (p: number, isFirst = false) => {
      if (!enabled) return;
      if (!keyword.trim()) return;
      if (inflightRef.current) return;

      const key = `${keyword}::${p}::${size}`;
      if (key === lastKeyRef.current) return;

      inflightRef.current = true;
      try {
        if (isFirst) setLoadingInitial(true);
        else setLoadingMore(true);

        const res = await fetcher({ keyword, page: Math.max(1, p), size });
        lastKeyRef.current = key;

        // 서버가 0-based page를 줄 수 있으니 안전 보정
        const safe: MyTroubleSearchPage = {
          content: res?.content ?? [],
          hasNext: !!res?.hasNext,
          totalPages: res?.totalPages ?? 0,
          totalElements: res?.totalElements ?? 0,
          page:
            typeof res?.page === "number"
              ? res.page >= 0
                ? res.page + 1
                : Math.max(1, p)
              : Math.max(1, p),
          size: res?.size ?? size,
          isFirst: res?.isFirst ?? p === 1,
          isLast: res?.isLast ?? !res?.hasNext,
        };

        // /my/search 아이템 타입 사용
        const raw = (safe.content as TroubleSearchCard[]) ?? [];
        const filtered = filterRef.current
          ? raw.filter(filterRef.current)
          : raw;

        const mapped = filtered.map((it) => toTroubleShootingCard(it, opt));

        // 중복 제거 병합 (id 기준)
        setItems((prev) => {
          const map = new Map<string, TroubleShootingCardProps>();
          for (const it of prev) map.set(it.id, it);
          for (const it of mapped) map.set(it.id, it);
          const arr = Array.from(map.values());
          setDisplayTotal(arr.length);
          return arr;
        });

        setPage(safe.page);
        setHasNext(!!safe.hasNext);
        setTotalElements(safe.totalElements);
        setTotalPages(safe.totalPages);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "검색 실패";
        setError(errorMessage);
      } finally {
        if (isFirst) setLoadingInitial(false);
        else setLoadingMore(false);
        inflightRef.current = false;
      }
    },
    [opt, enabled, keyword, size, fetcher]
  );

  useEffect(() => {
    if (!enabled || !keyword.trim()) {
      reset();
      return;
    }
    reset();
    void fetchPage(1, true);
  }, [enabled, keyword, size, opt, reset, fetchPage]);

  const loadMore = useCallback(() => {
    if (!enabled || !keyword.trim()) return;
    if (loadingMore || loadingInitial) return;
    if (!hasNext) return;
    if (inflightRef.current) return;
    void fetchPage(page + 1, false);
  }, [enabled, keyword, hasNext, page, loadingMore, loadingInitial, fetchPage]);

  return {
    items,
    loadingInitial,
    loadingMore,
    error,
    hasNext,
    totalElements,
    totalPages,
    displayTotal,
    loadMore,
    reset,
  };
}
