import { useNavigate } from "react-router-dom";
import CardFooterInfo from "./CardFooterInfo";
import CardPreviewArea from "./CardPreviewArea";
import CardTitleSection from "./CardTitleSection";
import TagList from "./TagList";
import type { StatusType, VisibilityType } from "@/types/project";
import { PATH } from "@/constants/paths";

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
  likeCount?: number;
  commentCount?: number;
  importance?: number;
  summaryType?: "자기소개서" | "면접대비" | "블로그" | "이슈관리";
  onClick?: (id: number) => void;
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
}: TroublogCardProps) {
  const navigate = useNavigate();

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
      />

      {/* 제목, 날짜, 태그 영역 */}
      <div className="flex justify-between items-end p-3 sm:p-4">
        <div className="flex flex-col items-start gap-[14px] sm:gap-[18px]">
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
