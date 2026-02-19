import { useRef, useState } from "react";
import { likeCommunityPost } from "@/api/community.api";

export interface UsePostLikeOptions {
  effectiveId: number;
  isCommunitySource: boolean;
  isLiked: boolean;
  likeCounts: number;
  setIsLiked: React.Dispatch<React.SetStateAction<boolean>>;
  setLikeCounts: React.Dispatch<React.SetStateAction<number>>;
}

export interface UsePostLikeReturn {
  isLiking: boolean;
  handleToggleLike: () => Promise<void>;
}

/**
 * 커뮤니티 포스트 좋아요 토글 로직
 */
export function usePostLike(options: UsePostLikeOptions): UsePostLikeReturn {
  const {
    effectiveId,
    isCommunitySource,
    isLiked,
    likeCounts,
    setIsLiked,
    setLikeCounts,
  } = options;

  const [isLiking, setIsLiking] = useState(false);
  const likeLockRef = useRef(false);

  const handleToggleLike = async () => {
    if (!Number.isFinite(effectiveId)) return;
    if (!isCommunitySource) {
      alert("작성 중/비공개 문서는 좋아요를 사용할 수 없어요.");
      return;
    }
    if (likeLockRef.current) return;
    likeLockRef.current = true;
    setIsLiking(true);

    const pid = effectiveId;
    const wasLiked = isLiked;
    const prevCount = likeCounts;

    if (wasLiked) {
      setIsLiked(false);
      setLikeCounts(Math.max(0, prevCount - 1));
      try {
        await likeCommunityPost(pid);
      } catch {
        setIsLiked(true);
        setLikeCounts(prevCount);
      } finally {
        likeLockRef.current = false;
        setIsLiking(false);
      }
    } else {
      setIsLiked(true);
      setLikeCounts(prevCount + 1);
      try {
        const res = await likeCommunityPost(pid);
        setLikeCounts(res?.likeCount ?? prevCount + 1);
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { status?: number; data?: { likeCount?: number } };
          status?: number;
        };
        const status =
          axiosErr?.response?.status ?? axiosErr?.status;
        const likeCountFromBody = axiosErr?.response?.data?.likeCount;

        if (status === 409) {
          setIsLiked(true);
          const count =
            typeof likeCountFromBody === "number" && Number.isFinite(likeCountFromBody)
              ? likeCountFromBody
              : prevCount + 1;
          setLikeCounts(count);
        } else {
          setIsLiked(false);
          setLikeCounts(prevCount);
        }
      } finally {
        likeLockRef.current = false;
        setIsLiking(false);
      }
    }
  };

  return { isLiking, handleToggleLike };
}
