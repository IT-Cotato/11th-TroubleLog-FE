import type { StatusType, VisibilityType } from "@/types/project";

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
        <div className="flex items-center gap-[6px]">
          <LikeCount count={likeCount} />
          <CommentCount count={commentCount} />
        </div>
      );
    }

    if (status !== "inProgress" && importance !== undefined) {
      return (
        <div className="flex items-center gap-1">
          <img
            src="/icons/star.svg"
            alt="중요도 아이콘"
            className="w-4 h-4 sm:w-[20px] sm:h-[20px]"
          />
          <span className="text-gray3 text-body-16-regular">{importance}</span>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="flex items-center gap-[6px]">
      <LikeCount count={likeCount} />
      <CommentCount count={commentCount} />
    </div>
  );
}

function LikeCount({ count = 0 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <img
        src="/icons/heart.svg"
        className="w-4 h-4 sm:w-[20px] sm:h-[20px]"
        alt="좋아요"
      />
      <span className="text-gray3 text-body-16-regular">{count}</span>
    </div>
  );
}

function CommentCount({ count = 0 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <img
        src="/icons/comment.svg"
        className="w-4 h-4 sm:w-[20px] sm:h-[20px]"
        alt="댓글"
      />
      <span className="text-gray3 text-body-16-regular">{count}</span>
    </div>
  );
}
