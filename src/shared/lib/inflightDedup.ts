/**
 * 동일 키에 대한 동시 요청을 하나로 묶기 위한 인플라이트 디듀핑 유틸.
 * HomePage, useCommunityCards 등에서 사용하는 패턴을 공통화.
 *
 * @example
 * const fetchPage = createInflightDedupedFetcher(
 *   (page, size) => `${page}:${size}`,
 *   (page, size) => getProjectList(page, size)
 * );
 * const res = await fetchPage(1, 10); // 동시에 여러 번 호출해도 요청 1번만 감
 */
export function createInflightDedupedFetcher<T, A extends unknown[]>(
  keyFn: (...args: A) => string,
  fetchFn: (...args: A) => Promise<T>
): (...args: A) => Promise<T> {
  const inflight = new Map<string, Promise<T>>();

  return (...args: A) => {
    const key = keyFn(...args);
    if (!inflight.has(key)) {
      const p = fetchFn(...args).finally(() => {
        inflight.delete(key);
      });
      inflight.set(key, p);
    }
    return inflight.get(key)!;
  };
}
