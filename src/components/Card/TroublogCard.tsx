import { useNavigate } from "react-router-dom";
import CardFooterInfo from "./CardFooterInfo";
import CardPreviewArea from "./CardPreviewArea";
import CardTitleSection from "./CardTitleSection";
import TagList from "./TagList";
import type { StatusType, VisibilityType } from "@/types/project";
import { PATH } from "@/constants/paths";
import { useCallback, useState } from "react";
import { hardDeletePost } from "@/api/post.api";

export interface TroublogCardProps {
  id: number;
  isMine: boolean;
  status: StatusType;
  visibility?: VisibilityType;
  errorCategory: string;
  title: string;
  createdAt: string;
  tags: string[];
  authorProfileImageUrl?: string;
  authorId?: number;
  likeCount?: number;
  commentCount?: number;
  importance?: number;
  summaryType?: "자기소개서" | "면접대비" | "블로그" | "이슈관리";
  onClick?: (id: number) => void;
  onAvatarClick?: () => void;
  onDeleted?: (id: number) => void;
  introduction?: string;
  summaryId?: number;
  postSummaryId?: number;
  summaries?: object[];
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
}: TroublogCardProps) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleRootClick = () => {
    if (typeof onClick === "function") {
      onClick(id);
    } else {
      navigate(PATH.COMMUNITY_POST(id));
    }
  };

  const handleRootKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRootClick();
    }
  };

  // 케밥 > 삭제
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
      onDeleted?.(id); // 부모에 알림(목록 갱신)
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

  return (
    <div
      className="w-full max-w-[384px] h-[300px] sm:h-[330px] shrink-0 rounded-2xl bg-white shadow-card cursor-pointer transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
      onClick={handleRootClick}
      onKeyDown={handleRootKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${title} 상세 페이지로 이동`}
    >
      {/* 프리뷰 영역 */}
      <CardPreviewArea
        errorCategory={errorCategory}
        isMine={isMine}
        status={status}
        authorProfileImageUrl={authorProfileImageUrl}
        onAvatarClick={onAvatarClick}
        onRequestDelete={handleRequestDelete}
        deleting={deleting}
      />

      {/* 제목, 날짜, 태그 영역 */}
      <div className="flex justify-between items-end p-3">
        <div className="flex flex-col items-start gap-[14px]">
          <CardTitleSection
            title={title}
            visibility={visibility}
            createdAt={createdAt}
            isMine={isMine}
            status={status}
            summaryType={summaryType}
          />
          <TagList tags={tags} />
        </div>
        <CardFooterInfo
          isMine={isMine}
          status={status}
          visibility={visibility}
          likeCount={likeCount}
          commentCount={commentCount}
          importance={importance}
        />
      </div>
    </div>
  );
}
