import { useCallback, useRef } from "react";

/**
 * 링크 hover 시 데이터 프리페칭을 위한 훅
 *
 * @example
 * const prefetch = usePrefetch();
 * <Link
 *   to="/user/mypage/123"
 *   onMouseEnter={() => prefetch('/user/mypage/123')}
 * >
 */
export function usePrefetch() {
  const prefetchCache = useRef<Set<string>>(new Set());

  const prefetch = useCallback((path: string) => {
    // 이미 프리페칭한 경로는 스킵
    if (prefetchCache.current.has(path)) {
      return;
    }

    // React Router의 prefetch 기능 활용
    // 실제로는 해당 경로의 데이터를 미리 가져오는 로직을 여기에 추가
    prefetchCache.current.add(path);

    // 예: API 호출을 미리 시작
    // fetch(`/api${path}`).catch(() => {});
  }, []);

  return prefetch;
}
