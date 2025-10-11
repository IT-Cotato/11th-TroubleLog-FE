import { useCallback, useMemo } from "react";
import {
  useInfiniteMyTroubleSearch,
  type Fetcher,
} from "../features/mypage/useInfiniteMyTroubleSearch";
import { searchUserTroubles } from "@/entities/trouble/api";
import type {
  TroubleSearchCard,
  MyTroubleSearchPage,
} from "@/types/troubles.server";

export function useInfiniteUserTroubleSearch(
  keyword: string,
  userId: number | null,
  size = 10
) {
  // 카드 기준 필터: 완료(= completedAt 존재)만 통과
  const filterCompleted = useCallback((x: TroubleSearchCard) => {
    return !!x.completedAt;
  }, []);

  // Fetcher 시그니처에 맞춰 반환: MyTroubleSearchPage | null
  const fetcher = useMemo<Fetcher>(() => {
    return async ({ keyword, page, size }) => {
      if (!userId || !keyword.trim()) return null;

      const res = await searchUserTroubles({ userId, keyword, page, size });
      const pageObj = (res as any)?.content ? res : (res as any)?.data;
      return pageObj as MyTroubleSearchPage;
    };
  }, [userId]);

  // 다른 사용자 카드 렌더링 옵션
  const opts = useMemo(
    () => ({ isMine: false, authorName: "사용자", isSearchResult: true }),
    []
  );

  return useInfiniteMyTroubleSearch(keyword, size, opts, {
    fetcher,
    filterItem: filterCompleted,
    enabled: !!userId && !!keyword.trim(),
  });
}
