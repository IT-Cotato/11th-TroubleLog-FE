import { useCallback, useMemo } from "react";
import { useInfiniteMyTroubleSearch } from "./useInfiniteMyTroubleSearch";
import { searchCommunityTroubles } from "@/api/trouble.api";
import type { MyTroubleServerItem } from "@/types/troubles.server";

export function useInfiniteCommunityTroubleSearch(keyword: string, size = 10) {
  // 공개 + 완료만 (작성 중 제외)
  const filterVisible = useCallback((x: MyTroubleServerItem) => {
    const visible = x.isVisible === true; // 서버가 boolean로 내려줌
    const statusRaw = String((x as any).postStatus ?? "");
    const inProgress =
      /작성\s*중/i.test(statusRaw) || /in[\s-_]*progress/i.test(statusRaw);
    const completed = /완료/i.test(statusRaw) && !inProgress; // "요약 완료"/"작성 완료" 등
    return visible && completed;
  }, []);

  // fetcher 주입 (키워드 없으면 호출 안 함)
  const fetcher = useMemo(() => {
    return ({
      keyword,
      page,
      size,
    }: {
      keyword: string;
      page: number;
      size: number;
    }) =>
      keyword.trim()
        ? searchCommunityTroubles({ keyword, page, size })
        : Promise.resolve(null);
  }, []);

  // 커뮤니티 결과 카드: 내 글 아님 + 검색 결과 표시
  const opts = useMemo(
    () => ({ isMine: false, authorName: "사용자", isSearchResult: true }),
    []
  );

  return useInfiniteMyTroubleSearch(keyword, size, opts, {
    fetcher,
    filterItem: filterVisible,
    enabled: !!keyword.trim(),
  });
}
