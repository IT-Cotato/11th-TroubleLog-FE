import { useNavigate } from "react-router-dom";
import CardFooterInfo from "@/entities/trouble/ui/CardFooterInfo";
import CardPreviewArea from "@/entities/trouble/ui/CardPreviewArea";
import CardTitleSection from "@/entities/trouble/ui/CardTitleSection";
import TagList from "@/entities/trouble/ui/TagList";
import type { StatusType, VisibilityType } from "@/types/project";
import { PATH } from "@/shared/config/paths";
import { useCallback, useState } from "react";
import { hardDeletePost, hardDeleteSummary } from "@/api/post.api";

import emptyThumbnail from "@/assets/images/thumbnail_empty.png";

export interface TroublogCardProps {
  id: number;
  isMine: boolean;
  status: StatusType;
  visibility?: VisibilityType;
  isVisible?: boolean;
  errorCategory: string;
  title: string;
  createdAt: string;
  tags: string[];
  authorProfileImageUrl?: string;
  authorId?: number;
  likeCount?: number;
  commentCount?: number;
  importance?: number;
  summaryType?: "자기소개서" | "면접대비" | "회고록" | "이슈관리";
  onClick?: (id: number) => void;
  onAvatarClick?: () => void;
  onDeleted?: (id: number) => void;
  introduction?: string;
  summaryId?: number;
  postSummaryId?: number;
  summaries?: object[];
  imageUrl?: string;
  compact?: boolean;
  onSummaryDeleted?: (summaryId: number) => void;
}

export default function TroublogCard({
  id,
  isMine,
  status,
  visibility,
  errorCategory,
  title,
  createdAt,
  tags,
  authorProfileImageUrl,
  likeCount,
  commentCount,
  importance,
  summaryType,
  onClick,
  onAvatarClick,
  onDeleted,
  imageUrl,
  compact = false,
  summaryId,
  onSummaryDeleted,
}: TroublogCardProps) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [summaryDeleting, setSummaryDeleting] = useState(false);
  const hasSummary = typeof summaryId === "number";

  const handleRootClick = () => {
    if (typeof onClick === "function") onClick(id);
    else navigate(PATH.COMMUNITY_POST_ID(String(id)));
  };

  const handleRootKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRootClick();
    }
  };

  const handleRequestDelete = useCallback(async () => {
    if (!isMine) return;
    if (
      !window.confirm(
        "이 문서를 영구적으로 삭제할까요? 삭제 후에는 복구할 수 없습니다."
      )
    )
      return;

    try {
      setDeleting(true);
      await hardDeletePost(id);
      onDeleted?.(id);
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ??
          "삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setDeleting(false);
    }
  }, [id, isMine, onDeleted]);

  const handleRequestDeleteSummary = useCallback(async () => {
    if (!isMine) return;
    if (!summaryId) return;

    if (
      !window.confirm(
        "이 문서의 요약본을 영구적으로 삭제할까요? 삭제 후에는 복구할 수 없습니다."
      )
    )
      return;

    try {
      setSummaryDeleting(true);
      await hardDeleteSummary(summaryId);
      onSummaryDeleted?.(summaryId);
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ??
          "요약본 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setSummaryDeleting(false);
    }
  }, [isMine, summaryId, onSummaryDeleted]);

  const rootSizeClass = compact
    ? // 10% 축소: 300→270, 330→297, 384→346 근사
      "max-w-[346px] h-[270px] sm:h-[297px]"
    : "max-w-[384px] h-[300px] sm:h-[330px]";

  const bodyPaddingClass = compact ? "p-2.5 pr-2 gap-3" : "p-3 pr-2 gap-3";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${title} 상세 페이지로 이동`}
      onClick={handleRootClick}
      onKeyDown={handleRootKeyDown}
      className={`
        group w-full ${rootSizeClass}
        shrink-0 rounded-2xl bg-white shadow-card cursor-pointer
        transition-shadow hover:shadow-lg
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        overflow-hidden flex flex-col
      `}
    >
      {/* 프리뷰 영역 */}
      <div className="relative rounded-t-2xl overflow-hidden">
        <CardPreviewArea
          errorCategory={errorCategory}
          isMine={isMine}
          status={status}
          authorProfileImageUrl={authorProfileImageUrl}
          onAvatarClick={onAvatarClick}
          onRequestDelete={handleRequestDelete}
          deleting={deleting}
          imageUrl={imageUrl || emptyThumbnail}
          hasSummary={hasSummary}
          onRequestDeleteSummary={handleRequestDeleteSummary}
          summaryDeleting={summaryDeleting}
        />
      </div>

      {/* 하단 섹션 */}
      <div className={`mt-auto ${bodyPaddingClass} min-w-0`}>
        {/* 상단: 에러종류 + 제목/작성일 */}
        <div className="w-full">
          {/* 에러종류 */}
          <div className="w-full">
            <span
              className="block text-body-16-regular text-gray-900 truncate"
              title={errorCategory}
            >
              [{errorCategory}]
            </span>
          </div>

          {/* 제목/메타 */}
          <div className="w-full min-w-0 mt-1">
            <CardTitleSection
              title={title}
              visibility={visibility}
              createdAt={createdAt}
              isMine={isMine}
              status={status}
              summaryType={summaryType}
            />
          </div>
        </div>

        {/* 전체 폭 구분선 (패딩만 제외) */}
        <div className="w-full h-px bg-gray-200 my-2" />

        {/* 하단: 태그(왼쪽) + 우측 푸터(오른쪽) */}
        <div className="w-full flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 overflow-hidden">
            <TagList tags={tags} />
          </div>
          <div className="shrink-0">
            <CardFooterInfo
              isMine={isMine}
              status={status}
              visibility={visibility as any}
              likeCount={likeCount}
              commentCount={commentCount}
              importance={importance}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
