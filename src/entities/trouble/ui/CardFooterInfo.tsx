import type { StatusType, VisibilityType } from "@/types/project";
import star from "@/assets/icons/star.svg";
import heart from "@/assets/icons/heart.svg";
import comment from "@/assets/icons/comment.svg";

interface CardFooterInfoProps {
  isMine: boolean;
  status: StatusType;
  visibility: VisibilityType;
  likeCount?: number;
  commentCount?: number;
  importance?: number;
}

export default function CardFooterInfo({
  isMine,
  status,
  visibility,
  likeCount,
  commentCount,
  importance,
}: CardFooterInfoProps) {
  if (isMine) {
    if (status === "complete" && visibility === "public") {
      return (
        <div className="flex items-center gap-1.5 sm:gap-[6px]">
          <LikeCount count={likeCount} />
          <CommentCount count={commentCount} />
        </div>
      );
    }

    if (status !== "inProgress" && importance !== undefined) {
      return (
        <div
          className="flex items-center gap-1"
          aria-label={`중요도 ${importance}`}
        >
          <img
            src={star}
            alt=""
            aria-hidden
            className="w-4 h-4 sm:w-5 sm:h-5"
          />
          <span className="text-gray3 text-body-14-regular sm:text-body-16-regular tabular-nums leading-none">
            {importance}
          </span>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-[6px]">
      <LikeCount count={likeCount} />
      <CommentCount count={commentCount} />
    </div>
  );
}

function LikeCount({ count = 0 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`좋아요 ${count}개`}>
      <img src={heart} className="w-4 h-4 sm:w-5 sm:h-5" alt="" aria-hidden />
      <span className="text-gray3 text-body-14-regular sm:text-body-16-regular tabular-nums leading-none">
        {count}
      </span>
    </div>
  );
}

function CommentCount({ count = 0 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`댓글 ${count}개`}>
      <img src={comment} className="w-4 h-4 sm:w-5 sm:h-5" alt="" aria-hidden />
      <span className="text-gray3 text-body-14-regular sm:text-body-16-regular tabular-nums leading-none">
        {count}
      </span>
    </div>
  );
}
