import { useCallback, useMemo } from "react";
import { useInfiniteMyTroubleSearch } from "./useInfiniteMyTroubleSearch";
import { searchCommunityTroubles } from "@/api/trouble.api";
import type { MyTroubleServerItem } from "@/types/troubles.server";

export function useInfiniteCommunityTroubleSearch(keyword: string, size = 10) {
  // 공개글만 노출
  const filterVisible = useCallback(
    (x: MyTroubleServerItem) =>
      x.isVisible === true ||
      String(x.isVisible ?? "").toUpperCase() === "PUBLIC",
    []
  );

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
