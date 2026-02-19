import { useEffect, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { getCommunityPostDetail } from "@/api/community.api";
import { getPostDetail } from "@/api/post.api";
import type { ViewPostResponse } from "@/models/post.model";
import { toCommunityPostVM } from "@/entities/trouble/mappers/communityPostDetail.mapper";
import { toPostDetailVM } from "@/entities/trouble/mappers/myPostDetail.mapper";
import { PATH } from "@/shared/config/paths";
import { parseApiError } from "@/shared/utils/apiErrorParser";
import {
  buildFreeformPrefill,
  buildTemplatePrefill,
} from "@/shared/utils/prefillBuilder";
import type { UseDetailContextReturn } from "@/hooks/useDetailContext";
import type { CommunityPostDetailProps } from "@/pages/Community/types";

export interface UsePostDetailOptions {
  /** 상세 로드 시작 시 호출 (댓글 상태 초기화 등) */
  onLoadStart?: () => void;
  /** 커뮤니티 상세 로드 완료 후 호출 (댓글 1페이지 로드 등) */
  onCommunityLoaded?: (postId: number, viewerId: number | null) => void;
  /** 이어쓰기 안내 한 번만 띄우기 위한 ref */
  resumePromptShownRef: React.MutableRefObject<Record<number, boolean>>;
}

export interface UsePostDetailReturn {
  post: CommunityPostDetailProps | null;
  setPost: React.Dispatch<React.SetStateAction<CommunityPostDetailProps | null>>;
  loading: boolean;
  loadError: ReturnType<typeof parseApiError> | null;
  isCommunitySource: boolean;
  isLiked: boolean;
  likeCounts: number;
  setIsLiked: React.Dispatch<React.SetStateAction<boolean>>;
  setLikeCounts: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * 커뮤니티 포스트 상세 데이터 로딩 로직 (커뮤/내상세 분기, 이어쓰기 안내 포함)
 */
export function usePostDetail(
  effectiveId: number,
  detailCtx: UseDetailContextReturn,
  navigate: NavigateFunction,
  options: UsePostDetailOptions
): UsePostDetailReturn {
  const {
    onLoadStart,
    onCommunityLoaded,
    resumePromptShownRef,
  } = options;

  const [post, setPost] = useState<CommunityPostDetailProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ReturnType<typeof parseApiError> | null>(null);
  const [isCommunitySource, setIsCommunitySource] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCounts, setLikeCounts] = useState(0);

  useEffect(() => {
    let cancelled = false;

    onLoadStart?.();
    setLoading(true);
    setLoadError(null);

    if (!Number.isFinite(effectiveId)) {
      setLoadError({ message: "잘못된 포스트 ID" });
      setLoading(false);
      return;
    }

    const loadCommunity = async () => {
      const communityData = await getCommunityPostDetail(effectiveId);
      if (cancelled) return;
      if (!communityData) throw new Error("빈 응답입니다.");
      const vm = toCommunityPostVM(communityData, detailCtx.viewerId);
      if (cancelled) return;
      setPost(vm);
      setIsLiked(vm.isLiked);
      setLikeCounts(vm.likeCounts);
      setIsCommunitySource(true);
      onCommunityLoaded?.(effectiveId, detailCtx.viewerId ?? null);
    };

    const loadMineDraft = async (id: number) => {
      const myDetail: ViewPostResponse = await getPostDetail(id);
      if (cancelled) return;
      const completedAt = myDetail.completedAt ?? null;
      const isDraft = completedAt == null;

      if (!isDraft) {
        throw new Error("완료 문서입니다. 커뮤니티 상세로 이동해야 합니다.");
      }

      const vmMine = toPostDetailVM(myDetail, detailCtx.viewerId);
      if (cancelled) return;
      setPost(vmMine);
      setIsLiked(vmMine.isLiked);
      setLikeCounts(vmMine.likeCounts);
      setIsCommunitySource(false);

      if (!resumePromptShownRef.current[id]) {
        resumePromptShownRef.current[id] = true;
        const ttRaw = myDetail.templateType;
        const tt = String(ttRaw ?? "").toUpperCase();

        const ok = window.confirm(
          tt === "FREE_FORM" || tt === "FREEFORM"
            ? "이 문서는 자유형식 글 작성 중이에요. 이어서 작성할까요?"
            : "이 문서는 가이드 템플릿 글 작성 중이에요. 이어서 작성할까요?"
        );

        if (cancelled) return;
        if (ok) {
          const baseState =
            tt === "FREE_FORM" || tt === "FREEFORM"
              ? buildFreeformPrefill(myDetail)
              : buildTemplatePrefill(myDetail);
          const editorPath =
            tt === "FREE_FORM" || tt === "FREEFORM"
              ? PATH.FREEFORM_WRITING
              : PATH.TEMP_WRITING;
          if (cancelled) return;
          navigate(editorPath, {
            replace: true,
            state: {
              ...baseState,
              postId: id,
              mode: "edit",
              from: "community-detail",
              projectId: myDetail.projectId ?? undefined,
              savePrefill:
                baseState.savePrefill != null
                  ? { ...baseState.savePrefill }
                  : undefined,
            },
          });
        }
      }
    };

    (async () => {
      try {
        const {
          viewerId,
          ownerId,
          statusFromList,
          isVisibleFromList,
          summaryIdFromList,
          isMineFromList,
          from,
        } = detailCtx;

        if (isVisibleFromList === false) {
          const myDetail: ViewPostResponse = await getPostDetail(effectiveId);
          if (cancelled) return;
          const completedAt = myDetail.completedAt ?? null;
          const isDraft = completedAt == null;
          if (isDraft) {
            await loadMineDraft(effectiveId);
          } else {
            const vmMine = toPostDetailVM(myDetail, viewerId);
            if (cancelled) return;
            setPost(vmMine);
            setIsLiked(vmMine.isLiked);
            setLikeCounts(vmMine.likeCounts);
            setIsCommunitySource(false);
          }
          return;
        }

        if (from === "project") {
          const myDetail: ViewPostResponse = await getPostDetail(effectiveId);
          if (cancelled) return;
          const completedAt = myDetail.completedAt ?? null;
          const isDraft = completedAt == null;
          if (isDraft) {
            await loadMineDraft(effectiveId);
          } else {
            const vmMine = toPostDetailVM(myDetail, viewerId);
            if (cancelled) return;
            setPost(vmMine);
            setIsLiked(vmMine.isLiked);
            setLikeCounts(vmMine.likeCounts);
            setIsCommunitySource(false);
          }
          return;
        }

        const mineByIds =
          viewerId != null &&
          ownerId != null &&
          String(ownerId) === String(viewerId);
        const isMine = isMineFromList === true ? true : mineByIds;

        if (isMine && statusFromList === "inProgress") {
          await loadMineDraft(effectiveId);
          return;
        }

        if (isMine && statusFromList === "created") {
          if (summaryIdFromList != null) {
            if (cancelled) return;
            navigate(PATH.COMBINED_DETAIL(effectiveId, summaryIdFromList), {
              replace: true,
              state: { from: "community-detail", ownerId: viewerId ?? undefined },
            });
            return;
          }
          try {
            const myDetail: ViewPostResponse = await getPostDetail(effectiveId);
            if (cancelled) return;
            const sid =
              (typeof myDetail.postSummaryId === "number" && myDetail.postSummaryId) ||
              (typeof myDetail.summaryId === "number" && myDetail.summaryId) ||
              null;
            if (sid != null) {
              if (cancelled) return;
              navigate(PATH.COMBINED_DETAIL(effectiveId, sid), {
                replace: true,
                state: { from: "community-detail", ownerId: viewerId ?? undefined },
              });
              return;
            }
          } catch {
            /* fallback to community */
          }
          await loadCommunity();
          return;
        }

        if (
          isMine &&
          statusFromList === "complete" &&
          typeof isVisibleFromList === "boolean"
        ) {
          if (isVisibleFromList) {
            await loadCommunity();
          } else {
            const myDetail: ViewPostResponse = await getPostDetail(effectiveId);
            if (cancelled) return;
            const vmMine = toPostDetailVM(myDetail, viewerId);
            if (cancelled) return;
            setPost(vmMine);
            setIsLiked(vmMine.isLiked);
            setLikeCounts(vmMine.likeCounts);
            setIsCommunitySource(false);
          }
          return;
        }

        if (isMine) {
          try {
            const myDetail: ViewPostResponse = await getPostDetail(effectiveId);
            if (cancelled) return;
            const isDraft = myDetail.completedAt == null;
            if (isDraft) {
              await loadMineDraft(effectiveId);
              return;
            }
            if (myDetail.isVisible === false) {
              const vmMine = toPostDetailVM(myDetail, viewerId);
              if (cancelled) return;
              setPost(vmMine);
              setIsLiked(vmMine.isLiked);
              setLikeCounts(vmMine.likeCounts);
              setIsCommunitySource(false);
              return;
            }
            await loadCommunity();
          } catch {
            if (cancelled) return;
            await loadCommunity();
          }
        } else {
          await loadCommunity();
        }
      } catch (err: unknown) {
        if (!cancelled) setLoadError(parseApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    effectiveId,
    detailCtx.viewerId,
    detailCtx.ownerId,
    detailCtx.statusFromList,
    detailCtx.isVisibleFromList,
    detailCtx.summaryIdFromList,
    detailCtx.isMineFromList,
    detailCtx.from,
    navigate,
    onLoadStart,
    onCommunityLoaded,
    resumePromptShownRef,
  ]);

  return {
    post,
    setPost,
    loading,
    loadError,
    isCommunitySource,
    isLiked,
    likeCounts,
    setIsLiked,
    setLikeCounts,
  };
}
