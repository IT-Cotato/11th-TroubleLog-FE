import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  getTroubleList,
  getProjectTroubleList,
  getUserTroubleList,
} from "@/api/trouble.api";
import {
  toTroublogCardVMs,
  type TroublogCardVM,
} from "@/mappers/troubleCard.mapper";
import type {
  ProjectTroubleQuery,
  TroubleListItem,
} from "@/types/trouble.model";
import { useViewerId } from "@/store/auth";

// 내 전체 목록 정렬용 (서버 스펙)
type SortParam = "latest" | "important";

type Source =
  | { type: "all" }
  | { type: "user"; userId: number }
  | { type: "project"; projectId: number; query: ProjectTroubleQuery };

interface Options {
  enabled?: boolean; // 기본값: true
  pageSize?: number; // 기본값: 10
  sortBy?: SortParam; // 기본값: "latest"
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

// (key|page|size|sort) 단위 in-flight 공유: 전체 목록용
const inflightPaged = new Map<string, Promise<PageResp>>();
const inflightUserPaged = new Map<string, Promise<PageResp>>();
// (project|query) 단위 in-flight 공유: 프로젝트 목록용
const inflightProject = new Map<string, Promise<TroubleListItem[]>>();

function makePagedKey(sk: string, page: number, size: number, sort: SortParam) {
  return `${sk}|p=${page}|s=${size}|sort=${sort}`;
}

function makeProjectKey(pid: number, q: ProjectTroubleQuery) {
  const { status, sort, visibility, summaryType } = q;
  return `project:${pid}|status=${status}|sort=${sort ?? ""}|vis=${
    visibility ?? ""
  }|sum=${summaryType ?? ""}`;
}

async function fetchPagedOnce(
  sk: string,
  page: number,
  size: number,
  sortBy: SortParam
) {
  const key = makePagedKey(sk, page, size, sortBy);
  if (!inflightPaged.has(key)) {
    const p = getTroubleList(page, size, sortBy).finally(() =>
      inflightPaged.delete(key)
    );
    inflightPaged.set(key, p);
  }
  return inflightPaged.get(key)!;
}

async function fetchUserPagedOnce(
  userId: number,
  page: number,
  size: number,
  sortBy: SortParam
) {
  const sk = `user:${userId}`;
  const key = makePagedKey(sk, page, size, sortBy);
  if (!inflightUserPaged.has(key)) {
    const p = getUserTroubleList(userId, page, size).finally(() =>
      inflightUserPaged.delete(key)
    );
    inflightUserPaged.set(key, p);
  }
  return inflightUserPaged.get(key)!;
}

async function fetchProjectOnce(pid: number, q: ProjectTroubleQuery) {
  const key = makeProjectKey(pid, q);
  if (!inflightProject.has(key)) {
    const p = getProjectTroubleList(pid, q).finally(() =>
      inflightProject.delete(key)
    );
    inflightProject.set(key, p);
  }
  return inflightProject.get(key)!;
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

  const srcKey = useMemo(() => {
    if (source.type === "all") return `all|sort=${sortBy}`;
    if (source.type === "user") return `user:${source.userId}|sort=${sortBy}`;
    const q = source.query;
    return `project:${source.projectId}|${q.status}|${q.sort}|${
      q.visibility ?? ""
    }|${q.summaryType ?? ""}`;
  }, [
    source.type,
    (source as any).userId,
    (source as any).projectId,
    (source as any).query?.status,
    (source as any).query?.sort,
    (source as any).query?.visibility,
    (source as any).query?.summaryType,
    sortBy,
  ]);

  const [cards, setCards] = useState<TroublogCardVM[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 전체 목록 전용 상태
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 콜백에서 최신값을 읽기 위한 refs (전체 목록 전용)
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
  // 무한스크롤 센티널 (전체 목록 전용)
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const requestedPagesRef = useRef<Set<number>>(new Set());

  const reset = useCallback(() => {
    setCards([]);
    idSetRef.current = new Set();
    setPage(1);
    setHasNext(false);
    setError(null);
    lastErrorAtRef.current = 0;
    requestedPagesRef.current = new Set();
  }, []);

  const viewerId = useViewerId();
  const myUserIdStr = viewerId != null ? String(viewerId) : null;

  // 소유자 플래그 오버라이드 헬퍼
  const applyOwnerFlag = useCallback(
    (vms: TroublogCardVM[]) => {
      if (source.type === "all" || source.type === "project") {
        return vms.map((x) => ({ ...x, isMine: true }));
      }
      if (source.type === "user") {
        const myId = typeof window !== "undefined" ? myUserIdStr : null;
        const ownerIsMe =
          myId != null && String(source.userId) === String(myId);
        return vms.map((x) => ({ ...x, isMine: ownerIsMe }));
      }
      return vms;
    },
    [source, myUserIdStr]
  );

  // 전체 목록: 특정 페이지 로드
  const loadPage = useCallback(
    async (targetPage: number, { append = true, dedupe = true } = {}) => {
      if (!enabled) return;
      if (targetPage !== 1 && !hasNextRef.current) return;
      if (requestedPagesRef.current.has(targetPage)) return;
      requestedPagesRef.current.add(targetPage);

      setIsLoading(true);
      setError(null);
      const mySeq = ++seqRef.current;

      try {
        let resp: PageResp;
        if (source.type === "user") {
          resp = dedupe
            ? await fetchUserPagedOnce(
                source.userId,
                targetPage,
                pageSize,
                sortBy
              )
            : await getUserTroubleList(source.userId, targetPage, pageSize);
        } else {
          // all
          resp = dedupe
            ? await fetchPagedOnce("all", targetPage, pageSize, sortBy)
            : await getTroubleList(targetPage, pageSize, sortBy);
        }

        if (seqRef.current !== mySeq) return;

        const list = Array.isArray(resp.content) ? resp.content : [];
        const listLen = list.length;

        const anyResp = resp as any;
        const isLast =
          typeof anyResp?.isLast === "boolean"
            ? anyResp.isLast
            : typeof anyResp?.last === "boolean"
            ? anyResp.last
            : undefined;

        const hasNextFromServer =
          typeof anyResp?.hasNext === "boolean"
            ? anyResp.hasNext
            : typeof anyResp?.hasNextPage === "boolean"
            ? anyResp.hasNextPage
            : undefined;

        let nextByServer: boolean | undefined;
        if (typeof hasNextFromServer === "boolean")
          nextByServer = hasNextFromServer;
        else if (typeof isLast === "boolean") nextByServer = !isLast;

        if (!append || targetPage === 1) {
          idSetRef.current = new Set(list.map((x) => x.id));
          setCards(applyOwnerFlag(toTroublogCardVMs(list))); // ← 오너 플래그 반영
          const next =
            typeof nextByServer === "boolean"
              ? nextByServer
              : listLen >= pageSize;
          setHasNext(next);
        } else {
          const add: TroubleListItem[] = [];
          for (const item of list) {
            if (!idSetRef.current.has(item.id)) {
              idSetRef.current.add(item.id);
              add.push(item);
            }
          }
          if (add.length === 0) {
            setHasNext(false);
            return;
          } else {
            setCards((prev) =>
              prev.concat(applyOwnerFlag(toTroublogCardVMs(add)))
            );
            const next =
              typeof nextByServer === "boolean"
                ? nextByServer
                : add.length >= pageSize;
            setHasNext(next);
          }
        }

        setPage(targetPage);
      } catch (e: any) {
        requestedPagesRef.current.delete(targetPage);
        if (seqRef.current === mySeq) {
          setError(e?.message ?? "불러오기 실패");
          lastErrorAtRef.current = Date.now();
          if (stopOnError) setHasNext(false);
        }
      } finally {
        if (seqRef.current === mySeq) setIsLoading(false);
      }
    },
    [enabled, pageSize, sortBy, stopOnError, source, applyOwnerFlag]
  );

  // 프로젝트 전용: 한 번 호출해서 끝 (페이징 없음)  ← (변경 없음)
  const loadProjectOnce = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);
    const mySeq = ++seqRef.current;

    try {
      const list =
        source.type === "project"
          ? await fetchProjectOnce(source.projectId, source.query)
          : [];

      if (seqRef.current !== mySeq) return;

      idSetRef.current = new Set(list.map((x) => x.id));
      setCards(toTroublogCardVMs(list));
      setHasNext(false); // 페이징 없음
      setPage(1);
    } catch (e: any) {
      if (seqRef.current === mySeq) {
        setError(e?.message ?? "불러오기 실패");
      }
    } finally {
      if (seqRef.current === mySeq) setIsLoading(false);
    }
  }, [enabled, source]);

  // 같은 srcKey에 대해 초기 로드가 이미 실행됐는지 체크
  const initKeyRef = useRef<string | null>(null);

  // 최초/의존성 변경 시 1페이지부터 로드  ← (변경 없음)
  useEffect(() => {
    if (!enabled) return;

    if (source.type === "all" || source.type === "user") {
      // 같은 키(srcKey)로는 1번만
      if (initKeyRef.current === srcKey) return;
      initKeyRef.current = srcKey;

      reset();
      void loadPage(1, { append: false, dedupe: true });
      return;
    }

    // project 목록: srcKey 바뀔 때마다 새로 불러옴 (락 적용 X)
    initKeyRef.current = null; // all로 돌아올 때 초기 로드 재실행 보장
    reset();
    void loadProjectOnce();
  }, [srcKey, enabled, source.type, loadPage, loadProjectOnce, reset]);

  // 외부에서 강제 새로고침  ← (변경 없음)
  const reload = useCallback(() => {
    reset();
    if (source.type === "all" || source.type === "user") {
      return loadPage(1, { append: false, dedupe: false });
    }
    return loadProjectOnce();
  }, [reset, loadPage, loadProjectOnce, source.type]);

  // 무한스크롤 옵저버 (전체 목록 전용)  ← (변경 없음)
  useEffect(() => {
    if (source.type === "project") return;
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
  }, [source.type, infinite, enabled, rootMargin, cooldownMs, loadPage]);

  // 수동 "더 보기"
  const loadMore = useCallback(() => {
    if (source.type === "project") return;
    if (!enabled || !hasNextRef.current || isLoadingRef.current) return;
    return loadPage(pageRef.current + 1, { append: true, dedupe: true });
  }, [enabled, loadPage, source.type]);

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
    // 무한스크롤용 센티널 ref
    sentinelRef,
  };
}
