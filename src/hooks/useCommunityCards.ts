import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCommunityList } from "@/api/community.api";
import type {
  CommunityServerCard,
  CommunitySort,
} from "@/types/community.model";
import { toCommunityCards } from "@/mappers/communityCard.mapper";
import type { TroublogCardProps } from "@/components/Card/TroublogCard";

type PageResp = {
  content: CommunityServerCard[];
  hasNext?: boolean;
  totalPages?: number;
  totalElements?: number;
  page?: number;
  size?: number;
  isFirst?: boolean;
  isLast?: boolean;
};

export type CommunityCardsFetcher = (
  page: number,
  size: number,
  sortBy: CommunitySort
) => Promise<PageResp>;

interface Options {
  enabled?: boolean; // 기본 true
  pageSize?: number; // 기본 12
  sortBy?: CommunitySort; // 기본 "latest"
  infinite?: boolean; // 기본 true
  rootMargin?: string; // 기본 "400px 0px"
  stopOnError?: boolean; // 기본 true
  cooldownMs?: number; // 기본 0
  fetcher?: CommunityCardsFetcher; // 기본 getCommunityList
  sourceKey?: string; // 캐시/리셋 구분용 키. 기본 "community"
}

// in-flight dedupe: (sort|page|size)
const inflightPaged = new Map<string, Promise<PageResp>>();
function keyFor(
  source: string,
  sort: CommunitySort,
  page: number,
  size: number
) {
  return `${source}|sort=${sort}|p=${page}|s=${size}`;
}

async function fetchOnce(
  source: string,
  fetcher: CommunityCardsFetcher,
  sort: CommunitySort,
  page: number,
  size: number
) {
  const key = keyFor(source, sort, page, size);
  if (!inflightPaged.has(key)) {
    const p = getCommunityList(page, size, sort).finally(() =>
      inflightPaged.delete(key)
    );
    inflightPaged.set(key, p);
  }
  return inflightPaged.get(key)!;
}

export default function useCommunityCards(opts: Options = {}) {
  const {
    enabled = true,
    pageSize = 12,
    sortBy = "latest",
    infinite = true,
    rootMargin = "400px 0px",
    stopOnError = true,
    cooldownMs = 0,
    fetcher = (p, s, sort) => getCommunityList(p, s, sort),
    sourceKey = "community",
  } = opts;

  const srcKey = useMemo(
    () => `${sourceKey}|sort=${sortBy}`,
    [sourceKey, sortBy]
  );

  const [cards, setCards] = useState<TroublogCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0); // 0-based

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const hasNextRef = useRef(false);
  const pageRef = useRef(0);
  const fetchingRef = useRef(false);
  const lastErrorAtRef = useRef(0);
  const requestedPagesRef = useRef<Set<number>>(new Set());
  const initKeyRef = useRef<string | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  useEffect(() => {
    hasNextRef.current = hasNext;
  }, [hasNext]);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const reset = useCallback(() => {
    setCards([]);
    setIsLoading(false);
    setError(null);
    setHasNext(false);
    setPage(0);
    lastErrorAtRef.current = 0;
    requestedPagesRef.current = new Set();
  }, []);

  const loadPage = useCallback(
    async (targetPage: number, { append = true, dedupe = true } = {}) => {
      if (!enabled) return;
      if (targetPage !== 0 && !hasNextRef.current) return;
      if (requestedPagesRef.current.has(targetPage)) return; // 중복 방지
      requestedPagesRef.current.add(targetPage);

      setIsLoading(true);
      setError(null);
      const mySeq = ++seqRef.current;
      try {
        const resp = dedupe
          ? await fetchOnce(sourceKey, fetcher, sortBy, targetPage, pageSize)
          : await fetcher(targetPage, pageSize, sortBy);

        if (seqRef.current !== mySeq) return;

        const list = Array.isArray(resp.content) ? resp.content : [];
        const vm = toCommunityCards(list);

        // 서버 메타 우선
        const any = resp as any;
        const isLast =
          typeof any?.isLast === "boolean"
            ? any.isLast
            : typeof any?.last === "boolean"
            ? any.last
            : undefined;
        const hasNextServer =
          typeof any?.hasNext === "boolean"
            ? any.hasNext
            : typeof any?.hasNextPage === "boolean"
            ? any.hasNextPage
            : undefined;

        const next =
          typeof hasNextServer === "boolean"
            ? hasNextServer
            : typeof isLast === "boolean"
            ? !isLast
            : vm.length >= pageSize;

        if (!append || targetPage === 0) {
          setCards(vm);
          setHasNext(next);
        } else {
          setCards((prev) => prev.concat(vm));
          setHasNext(next);
        }

        setPage(targetPage);
      } catch (e: any) {
        requestedPagesRef.current.delete(targetPage);
        setError(e?.message ?? "커뮤니티 목록 불러오기 실패");
        lastErrorAtRef.current = Date.now();
        if (stopOnError) setHasNext(false);
      } finally {
        if (seqRef.current === mySeq) setIsLoading(false);
      }
    },
    [enabled, pageSize, sortBy, stopOnError, fetcher, sourceKey]
  );

  // 초기 로드 (sort 변경 시 리셋 후 p=0)
  useEffect(() => {
    if (!enabled) return;
    if (initKeyRef.current === srcKey) return;
    initKeyRef.current = srcKey;

    reset();
    void loadPage(0, { append: false, dedupe: true });
  }, [enabled, srcKey, reset, loadPage]);

  // 무한스크롤 옵저버
  useEffect(() => {
    if (!infinite || !enabled) return;
    if (!sentinelRef.current) return;

    const el = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (fetchingRef.current) return;
        if (!hasNextRef.current) return;

        if (cooldownMs > 0 && lastErrorAtRef.current) {
          const elapsed = Date.now() - lastErrorAtRef.current;
          if (elapsed < cooldownMs) return;
        }

        fetchingRef.current = true;
        void loadPage(pageRef.current + 1, {
          append: true,
          dedupe: true,
        }).finally(() => {
          fetchingRef.current = false;
        });
      },
      { root: null, rootMargin, threshold: 0 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [infinite, enabled, rootMargin, cooldownMs, loadPage]);

  const loadMore = useCallback(() => {
    if (!enabled || !hasNextRef.current || isLoadingRef.current) return;
    return loadPage(pageRef.current + 1, { append: true, dedupe: true });
  }, [enabled, loadPage]);

  return {
    cards,
    isLoading,
    error,
    hasNext,
    loadMore,
    reset,
    sentinelRef,
  };
}
