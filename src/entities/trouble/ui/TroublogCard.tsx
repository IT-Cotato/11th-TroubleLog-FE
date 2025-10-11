import { useNavigate } from "react-router-dom";
import CardFooterInfo from "@/entities/trouble/ui/CardFooterInfo";
import CardPreviewArea from "@/entities/trouble/ui/CardPreviewArea";
import CardTitleSection from "@/entities/trouble/ui/CardTitleSection";
import TagList from "@/entities/trouble/ui/TagList";
import type { StatusType, VisibilityType } from "@/types/project";
import { PATH } from "@/shared/config/paths";
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
  imageUrl?: string;
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
}: TroublogCardProps) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleRootClick = () => {
    if (typeof onClick === "function") onClick(id);
    else navigate(PATH.COMMUNITY_POST(String(id)));
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

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${title} 상세 페이지로 이동`}
      onClick={handleRootClick}
      onKeyDown={handleRootKeyDown}
      className="
      group w-full max-w-[384px] h-[300px] sm:h-[330px]
      shrink-0 rounded-2xl bg-white shadow-card cursor-pointer
      transition-shadow hover:shadow-lg
      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
      overflow-hidden flex flex-col
    "
    >
      {/* 프리뷰 영역: 기존 크기 유지 */}
      <div className="relative rounded-t-2xl overflow-hidden">
        <CardPreviewArea
          errorCategory={errorCategory}
          isMine={isMine}
          status={status}
          authorProfileImageUrl={authorProfileImageUrl}
          onAvatarClick={onAvatarClick}
          onRequestDelete={handleRequestDelete}
          deleting={deleting}
          imageUrl={imageUrl}
        />
      </div>

      {/* 하단 섹션: 오른쪽 패딩을 줄여 제목이 쓸 수 있는 폭 확대 */}
      <div className="mt-auto flex justify-between items-end p-3 pr-2 gap-3 min-w-0">
        <div className="flex-1 min-w-0 flex flex-col items-start gap-[14px]">
          {/* 제목/메타: 폭 제한을 부모에게 맡기고 한 줄 말줄임 */}
          <div className="w-full min-w-0">
            <CardTitleSection
              title={title}
              visibility={visibility}
              createdAt={createdAt}
              isMine={isMine}
              status={status}
              summaryType={summaryType}
            />
          </div>

          {/* 태그: 넘침 방지 */}
          <div className="w-full min-w-0 overflow-hidden">
            <TagList tags={tags} />
          </div>
        </div>

        {/* 우측 푸터는 눌리지 않도록 */}
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
  );
}
