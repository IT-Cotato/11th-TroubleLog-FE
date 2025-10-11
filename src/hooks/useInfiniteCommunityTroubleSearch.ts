import { useCallback, useMemo } from "react";
import {
  useInfiniteMyTroubleSearch,
  type Fetcher,
} from "../features/mypage/useInfiniteMyTroubleSearch";
import { searchCommunityTroubles } from "@/entities/trouble/api";

import type {
  TroubleSearchCard,
  MyTroubleSearchPage,
  CommunityTroubleSearchItem,
  CommunityTroubleSearchPage,
} from "@/types/troubles.server";

// CommunityTroubleSearchItem -> TroubleSearchCard
function toTroubleSearchCard(x: CommunityTroubleSearchItem): TroubleSearchCard {
  // 완료/진행중 판정
  const statusRaw = String(x.postStatus ?? "");
  const inProgress =
    /작성\s*중/i.test(statusRaw) || /in[\s_-]*progress/i.test(statusRaw);
  const isDoneByStatus = /완료/i.test(statusRaw) && !inProgress;

  // 공개글만 completedAt 부여
  const isPublic = x.isVisible === true || (x as any).visibility === "PUBLIC";

  const completedAt =
    isPublic && (isDoneByStatus || x.isSummaryCreated)
      ? x.updatedAt ?? x.createdAt
      : null;

  return {
    id: x.id,
    title: x.title,
    thumbnailUrl: x.thumbnailUrl,
    completedAt,
    errorTag: x.errorTag,
    postTags: x.postTags ?? [],
    likeCount: x.likeCount,
    commentCount: x.commentCount,
    postCardUserInfoResDto: x.userInfo,
    introduction: x.introduction,
    summaryId: null,
    postSummaryId: null,
    summaries: [],
  };
}

// CommunityTroubleSearchPage -> MyTroubleSearchPage
function adaptPage(p: CommunityTroubleSearchPage): MyTroubleSearchPage {
  return {
    ...p,
    content: p.content.map(toTroubleSearchCard),
  };
}

export function useInfiniteCommunityTroubleSearch(keyword: string, size = 10) {
  const filterCompleted = useCallback((x: TroubleSearchCard) => {
    return !!x.completedAt;
  }, []);

  const fetcher = useMemo<Fetcher>(
    () =>
      async ({ keyword, page, size }) => {
        if (!keyword.trim()) return null;
        const res = await searchCommunityTroubles({ keyword, page, size });
        return adaptPage(res as CommunityTroubleSearchPage);
      },
    []
  );

  const opts = useMemo(
    () => ({ isMine: false, authorName: "사용자", isSearchResult: true }),
    []
  );

  return useInfiniteMyTroubleSearch(keyword, size, opts, {
    fetcher,
    filterItem: filterCompleted,
    enabled: !!keyword.trim(),
  });
}
