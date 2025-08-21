import publicIcon from "@/assets/icons/public.svg";
import privateIcon from "@/assets/icons/private.svg";

interface CardTitleSectionProps {
  title: string;
  visibility: "public" | "private" | undefined;
  createdAt: string;
  isMine: boolean;
  status: "inProgress" | "complete" | "created";
  summaryType?: string;
}

export default function CardTitleSection({
  title,
  visibility,
  createdAt,
  isMine,
  status,
  summaryType,
}: CardTitleSectionProps) {
  return (
    <div className="gap-2">
      {/* 제목 + 공개/비공개 아이콘(or 요약 유형) */}
      <div className="flex items-center min-w-0">
        {/* 제목: 컨테이너 제약 내에서만 잘림/말줄임 */}
        <span className="min-w-0 truncate text-head-20-semibold" title={title}>
          {title}
        </span>

        {/* 바로 옆(작은 여백) */}
        {isMine &&
          (status === "created" && summaryType ? (
            <span className="ml-1 sm:ml-2 text-body-16-regular text-gray3 shrink-0">
              {summaryType}
            </span>
          ) : (
            <img
              src={visibility === "public" ? publicIcon : privateIcon}
              className="ml-1 sm:ml-2 w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] shrink-0"
              alt={visibility === "public" ? "공개" : "비공개"}
            />
          ))}
      </div>

      {/* 작성일 */}
      <div className="text-body-14-regular text-gray3">{createdAt}</div>
    </div>
  );
}
