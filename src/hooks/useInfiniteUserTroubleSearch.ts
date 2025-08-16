import { useCallback, useMemo } from "react";
import { useInfiniteMyTroubleSearch } from "./useInfiniteMyTroubleSearch";
import { searchUserTroubles } from "@/api/trouble.api";
import type { MyTroubleServerItem } from "@/types/troubles.server";

export function useInfiniteUserTroubleSearch(
  keyword: string,
  userId: number | null,
  size = 10
) {
  // 공개 + 완료만 (작성 중 제외)
  const filterVisible = useCallback((x: MyTroubleServerItem) => {
    const visible = x.isVisible === true; // 서버가 boolean로 내려줌
    const statusRaw = String(x.postStatus ?? "");
    const inProgress =
      /작성\s*중/i.test(statusRaw) || /in[\s_-]*progress/i.test(statusRaw);
    const completed = /완료/i.test(statusRaw) && !inProgress; // "요약 완료"/"작성 완료" 등
    return visible && completed;
  }, []);

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
