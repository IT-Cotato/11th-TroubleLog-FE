import CardFooterInfo from "./CardFooterInfo";
import CardPreviewArea from "./CardPreviewArea";
import CardTitleSection from "./CardTitleSection";
import TagList from "./TagList";
import type { StatusType, VisibilityType } from "@/types/project";

export interface TroublogCardProps {
  isMine: boolean;
  status: StatusType;
  visibility: VisibilityType;
  errorCategory: string;
  title: string;
  createdAt: string;
  tags: string[];
  authorProfileImageUrl?: string;
  likeCount?: number;
  commentCount?: number;
  importance?: number;
}

export default function TroublogCard({
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
}: TroublogCardProps) {
  return (
    <div className="w-full max-w-[384px] h-[300px] sm:h-[330px] shrink-0 rounded-2xl bg-white shadow-card">
      {/* 프리뷰 영역 */}
      <CardPreviewArea
        errorCategory={errorCategory}
        isMine={isMine}
        status={status}
        authorProfileImageUrl={authorProfileImageUrl}
      />

      {/* 제목, 날짜, 태그 영역 */}
      <div className="flex justify-between items-end p-3 sm:p-4">
        <div className="flex flex-col items-start gap-[14px] sm:gap-[18px]">
          <CardTitleSection
            title={title}
            visibility={visibility}
            createdAt={createdAt}
            isMine={isMine}
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
