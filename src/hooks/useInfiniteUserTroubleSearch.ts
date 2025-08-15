import { useCallback, useMemo } from "react";
import { useInfiniteMyTroubleSearch } from "./useInfiniteMyTroubleSearch";
import { searchUserTroubles } from "@/api/trouble.api";
import type { MyTroubleServerItem } from "@/types/troubles.server";

export function useInfiniteUserTroubleSearch(
  keyword: string,
  userId: number | null,
  size = 10
) {
  // 공개글만 (isVisible === true)
  const filterVisible = useCallback(
    (x: MyTroubleServerItem) =>
      x.isVisible === true ||
      String(x.isVisible ?? "").toUpperCase() === "PUBLIC",
    []
  );

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
      userId
        ? searchUserTroubles({ userId, keyword, page, size })
        : Promise.resolve(null);
  }, [userId]);

  // 다른 사용자 카드
  const opts = useMemo(
    () => ({ isMine: false, authorName: "사용자", isSearchResult: true }),
    []
  );

  return useInfiniteMyTroubleSearch(keyword, size, opts, {
    fetcher,
    filterItem: filterVisible,
    enabled: !!userId && !!keyword.trim(),
  });
}
