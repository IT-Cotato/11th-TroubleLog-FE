import { useCallback, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import useClickOutside from "@/hooks/useClickOutside";
import { hardDeletePost } from "@/api/post.api";
import { PATH } from "@/shared/config/paths";
import type { DetailFromSource } from "@/hooks/useDetailContext";

export type ReportTarget =
  | { type: "post"; postId: number }
  | { type: "comment"; commentId: string }
  | null;

export interface UsePostMenuOptions {
  effectiveId: number;
  from: DetailFromSource;
  navigate: NavigateFunction;
}

export interface UsePostMenuReturn {
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
  deleting: boolean;
  reportModalOpen: boolean;
  setReportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  reportTarget: ReportTarget;
  setReportTarget: React.Dispatch<React.SetStateAction<ReportTarget>>;
  closeMenu: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  handleDeletePost: () => Promise<void>;
}

/**
 * 케밥 메뉴·삭제·신고 모달 상태 및 포스트 삭제 핸들러
 */
export function usePostMenu(options: UsePostMenuOptions): UsePostMenuReturn {
  const { effectiveId, from, navigate } = options;

  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null);

  const closeMenu = useCallback(() => setShowMenu(false), []);
  const menuRef = useClickOutside<HTMLDivElement>(() => setShowMenu(false));

  const handleDeletePost = useCallback(async () => {
    if (!Number.isFinite(effectiveId)) return;
    if (
      !window.confirm(
        "이 문서를 영구적으로 삭제할까요? 삭제 후에는 복구할 수 없습니다."
      )
    )
      return;

    try {
      setDeleting(true);
      await hardDeletePost(effectiveId);
      alert("문서가 영구 삭제되었습니다.");
      if (from === "community") {
        navigate(PATH.COMMUNITY, { replace: true });
      } else {
        navigate(-1);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ??
        "삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      alert(msg);
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  }, [effectiveId, from, navigate]);

  return {
    showMenu,
    setShowMenu,
    deleting,
    reportModalOpen,
    setReportModalOpen,
    reportTarget,
    setReportTarget,
    closeMenu,
    menuRef,
    handleDeletePost,
  };
}
