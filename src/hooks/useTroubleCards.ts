import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getTroubleList, getProjectTroubleList } from "@/api/trouble.api";
import {
  toTroublogCardVMs,
  type TroublogCardVM,
} from "@/mappers/troubleCard.mapper";
import type { TroubleListItem, TroubleSort } from "@/types/trouble.model";

type Source = { type: "all" } | { type: "project"; projectId: number };

interface Options {
  enabled?: boolean; // 기본값: true
  pageSize?: number; // 기본값: 10
  sortBy?: TroubleSort; // 기본값: "latest"
  infinite?: boolean; // 기본값: false
  rootMargin?: string; // 기본값: "300px 0px"
  stopOnError?: boolean; // 에러 시 자동 로딩 중단 (기본 true)
  cooldownMs?: number; // 에러 후 자동 재시도 금지 시간 (기본 0: 사용 안 함)
}

type PageResp = {
  content: TroubleListItem[];
  hasNext?: boolean;
  totalPages?: number;
  totalElements?: number;
  page?: number;
  size?: number;
  isFirst?: boolean;
  isLast?: boolean;
};

// (key|page|size|sort) 단위 in-flight Promise 공유로 StrictMode 중복 방지
const inflight = new Map<string, Promise<PageResp>>();

function makeKey(sk: string, page: number, size: number, sort: TroubleSort) {
  return `${sk}|p=${page}|s=${size}|sort=${sort}`;
}

async function fetchOnceByKey(
  sk: string,
  pid: number | null,
  page: number,
  size: number,
  sortBy: TroubleSort
) {
  const key = makeKey(sk, page, size, sortBy);
  if (!inflight.has(key)) {
    const p =
      sk === "all"
        ? getTroubleList(page, size, sortBy)
        : getProjectTroubleList(pid!, page, size, sortBy);
    inflight.set(
      key,
      p.finally(() => inflight.delete(key))
    );
  }
  return inflight.get(key)!;
}

export default function useTroubleCards(source: Source, options: Options = {}) {
  const {
    enabled = true,
    pageSize = 10,
    sortBy = "latest",
    infinite = false,
    rootMargin = "300px 0px",
    stopOnError = true,
    cooldownMs = 0,
  } = options;

  // source를 원시값으로 분해 (의존성 안정화)
  const srcKey = useMemo(
    () => (source.type === "all" ? "all" : `project:${source.projectId}`),
    [source.type, (source as any).projectId]
  );
  const projectId = source.type === "project" ? source.projectId : null;

  const [cards, setCards] = useState<TroublogCardVM[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 콜백에서 최신값을 읽기 위한 refs
  const isLoadingRef = useRef(false);
  const hasNextRef = useRef(false);
  const pageRef = useRef(1);
  const fetchingRef = useRef(false); // 옵저버 중복 실행 락
  const lastErrorAtRef = useRef<number>(0);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  useEffect(() => {
    hasNextRef.current = hasNext;
  }, [hasNext]);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // 최신 요청만 반영하기 위한 시퀀스
  const seqRef = useRef(0);
  // 중복 카드 방지용
  const idSetRef = useRef<Set<number>>(new Set());
  // 무한스크롤 센티널
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const reset = useCallback(() => {
    setCards([]);
    idSetRef.current = new Set();
    setPage(1);
    setHasNext(false);
    setError(null);
    lastErrorAtRef.current = 0;
  }, []);

  // 특정 페이지 로드
  const loadPage = useCallback(
    async (
      targetPage: number,
      {
        append = true,
        dedupe = true,
      }: { append?: boolean; dedupe?: boolean } = {}
    ) => {
      if (!enabled) return;
      // 1페이지가 아닌데 더 불러올 게 없으면 차단 (ref 기준)
      if (targetPage !== 1 && !hasNextRef.current) return;

      setIsLoading(true);
      setError(null);
      const mySeq = ++seqRef.current;

      try {
        const resp = dedupe
          ? await fetchOnceByKey(
              srcKey,
              projectId,
              targetPage,
              pageSize,
              sortBy
            )
          : projectId == null
          ? await getTroubleList(targetPage, pageSize, sortBy)
          : await getProjectTroubleList(
              projectId,
              targetPage,
              pageSize,
              sortBy
            );

        if (seqRef.current !== mySeq) return;

        const list = Array.isArray(resp.content) ? resp.content : [];
        // 서버가 hasNext 또는 isLast 둘 중 하나만 줄 수 있으므로 보수적으로 계산
        const next =
          resp.hasNext ?? (resp.isLast !== undefined ? !resp.isLast : false);
        setHasNext(next);

        if (!append || targetPage === 1) {
          idSetRef.current = new Set(list.map((x) => x.id));
          setCards(toTroublogCardVMs(list));
        } else {
          const add: TroubleListItem[] = [];
          for (const item of list) {
            if (!idSetRef.current.has(item.id)) {
              idSetRef.current.add(item.id);
              add.push(item);
            }
          }
          setCards((prev) => prev.concat(toTroublogCardVMs(add)));
        }

        setPage(targetPage);
      } catch (e: any) {
        if (seqRef.current === mySeq) {
          setError(e?.message ?? "불러오기 실패");
          lastErrorAtRef.current = Date.now();
          if (stopOnError) setHasNext(false); // 자동 로딩 중단
        }
      } finally {
        if (seqRef.current === mySeq) setIsLoading(false);
      }
    },
    // 상태(hasNext 등)에 직접 의존하지 않고, 안정된 원시값만 의존
    [enabled, pageSize, sortBy, srcKey, projectId, stopOnError]
  );

  // 최초/의존성 변경 시 1페이지부터 로드
  useEffect(() => {
    reset();
    void loadPage(1, { append: false, dedupe: true });
  }, [srcKey, pageSize, sortBy, reset, loadPage]);

  // 외부에서 강제 새로고침
  const reload = useCallback(() => {
    reset();
    return loadPage(1, { append: false, dedupe: false });
  }, [reset, loadPage]);

  // 무한스크롤 옵저버 (옵션 켜진 경우에만)
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

        // 에러 쿨다운 옵션
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

  // 수동 "더 보기"용
  const loadMore = useCallback(() => {
    if (!enabled || !hasNextRef.current || isLoadingRef.current) return;
    return loadPage(pageRef.current + 1, { append: true, dedupe: true });
  }, [enabled, loadPage]);

  return {
    // 데이터
    cards,
    isLoading,
    error,
    hasNext,
    // 동작
    reload,
    loadMore,
    reset,
    // 무한스크롤 센티널 ref
    sentinelRef,
  };
}
