import { useCallback, useEffect, useRef, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { getPostDetail } from "@/api/post.api";
import { postFollow, postUnfollow } from "@/api/user.api";
import type { ViewPostResponse } from "@/models/post.model";
import { PATH } from "@/shared/config/paths";
import { buildEditorNavigationState } from "@/shared/utils/prefillBuilder";
import type { CommunityPostDetailProps } from "@/pages/Community/types";

const DEFAULT_HEADER_OFFSET = 100;

export interface UsePostNavigationOptions {
  effectiveId: number;
  post: CommunityPostDetailProps | null;
  setPost: React.Dispatch<React.SetStateAction<CommunityPostDetailProps | null>>;
  navigate: NavigateFunction;
  closeMenu: () => void;
  viewerId: number | null;
  headerOffset?: number;
}

export interface UsePostNavigationReturn {
  contentColRef: React.RefObject<HTMLDivElement | null>;
  sectionRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  currentSection: number;
  asideOffset: number;
  scrollToSection: (idx: number) => void;
  goEditWithPrefill: () => Promise<void>;
  handleProfileClick: () => void;
  handleFollow: () => Promise<void>;
  handleUnfollow: () => Promise<void>;
  goBack: () => void;
  goCommunity: () => void;
  goHome: () => void;
  goLogin: () => void;
  goMyPage: () => void;
}

/**
 * 목차 스크롤, 수정 이동, 프로필/팔로우, CTA(이전/홈/마이페이지 등) 네비게이션 로직
 */
export function usePostNavigation(
  options: UsePostNavigationOptions
): UsePostNavigationReturn {
  const {
    effectiveId,
    post,
    setPost,
    navigate,
    closeMenu,
    viewerId,
    headerOffset = DEFAULT_HEADER_OFFSET,
  } = options;

  const contentColRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [asideOffset, setAsideOffset] = useState(0);
  const navigatingRef = useRef(false);

  useEffect(() => {
    const updateAsideOffset = () => {
      const first = sectionRefs.current[0];
      const col = contentColRef.current;
      if (!first || !col) {
        setAsideOffset(0);
        return;
      }
      const firstTop = first.getBoundingClientRect().top + window.scrollY;
      const colTop = col.getBoundingClientRect().top + window.scrollY;
      setAsideOffset(Math.max(0, Math.round(firstTop - colTop)));
    };
    requestAnimationFrame(updateAsideOffset);
    const onResize = () => updateAsideOffset();
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && contentColRef.current) {
      ro = new ResizeObserver(updateAsideOffset);
      ro.observe(contentColRef.current);
    }
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
      ro?.disconnect();
    };
  }, [post]);

  useEffect(() => {
    const updateCurrentSection = () => {
      const y = window.scrollY + headerOffset + 1;
      let cur = 0;
      sectionRefs.current.forEach((ref, idx) => {
        if (!ref) return;
        const top = ref.getBoundingClientRect().top + window.scrollY;
        if (y >= top) cur = idx;
      });
      setCurrentSection(cur);
    };
    window.addEventListener("scroll", updateCurrentSection, { passive: true });
    updateCurrentSection();
    return () => window.removeEventListener("scroll", updateCurrentSection);
  }, [headerOffset]);

  const scrollToSection = useCallback((idx: number) => {
    const target = sectionRefs.current[idx];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const goEditWithPrefill = useCallback(async () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    closeMenu();
    try {
      if (!Number.isFinite(effectiveId)) {
        navigatingRef.current = false;
        return;
      }
      const myDetail: ViewPostResponse = await getPostDetail(effectiveId);
      const { path, state } = buildEditorNavigationState(myDetail, effectiveId);
      queueMicrotask(() => {
        navigate(path, { replace: true, state });
      });
    } catch {
      navigatingRef.current = false;
      alert(
        "수정 화면으로 이동하기 위한 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요."
      );
    }
  }, [effectiveId, navigate, closeMenu]);

  const handleProfileClick = useCallback(() => {
    if (!post || post.authorId == null) return;
    navigate(PATH.MYPAGE_ID(String(post.authorId)));
  }, [post, navigate]);

  const handleFollow = useCallback(async () => {
    if (!post || post.authorId == null) return;
    setPost((prev) =>
      prev
        ? { ...prev, isFollowed: true, authorFollowers: (prev.authorFollowers ?? 0) + 1 }
        : prev
    );
    try {
      await postFollow(Number(post?.authorId));
    } catch {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              isFollowed: false,
              authorFollowers: Math.max(0, (prev.authorFollowers ?? 1) - 1),
            }
          : prev
      );
    }
  }, [post?.authorId, setPost]);

  const handleUnfollow = useCallback(async () => {
    if (!post || post.authorId == null) return;
    setPost((prev) =>
      prev
        ? { ...prev, isFollowed: false, authorFollowers: Math.max(0, (prev.authorFollowers ?? 1) - 1) }
        : prev
    );
    try {
      await postUnfollow(Number(post?.authorId));
    } catch {
      setPost((prev) =>
        prev
          ? {
              ...prev,
              isFollowed: true,
              authorFollowers: (prev.authorFollowers ?? 0) + 1,
            }
          : prev
      );
    }
  }, [post?.authorId, setPost]);

  const goBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate(PATH.COMMUNITY, { replace: true });
  }, [navigate]);

  const goCommunity = useCallback(() => navigate(PATH.COMMUNITY, { replace: true }), [navigate]);
  const goHome = useCallback(() => navigate(PATH.HOME, { replace: true }), [navigate]);
  const goLogin = useCallback(() => {
    const sp = new URLSearchParams();
    sp.set("next", window.location.pathname + window.location.search);
    navigate(`${PATH.ROOT}?${sp.toString()}`, { replace: true });
  }, [navigate]);
  const goMyPage = useCallback(() => {
    if (viewerId != null) navigate(PATH.MYPAGE_BASE);
    else goLogin();
  }, [viewerId, navigate, goLogin]);

  return {
    contentColRef,
    sectionRefs,
    currentSection,
    asideOffset,
    scrollToSection,
    goEditWithPrefill,
    handleProfileClick,
    handleFollow,
    handleUnfollow,
    goBack,
    goCommunity,
    goHome,
    goLogin,
    goMyPage,
  };
}
