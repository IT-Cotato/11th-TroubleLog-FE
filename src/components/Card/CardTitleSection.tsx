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
      {/* 제목 + 공개 여부 아이콘 or 요약 유형 */}
      <div className="flex items-start gap-1 sm:gap-2 min-w-0">
        {/* 고정 max-w 제거하고 부모 폭을 최대로 사용해 한 줄 말줄임 */}
        <div
          className="flex-1 min-w-0 text-head-20-semibold whitespace-nowrap overflow-hidden text-ellipsis"
          title={title}
        >
          {title}
        </div>

        {isMine &&
          (status === "created" && summaryType ? (
            <span className="text-body-16-regular text-gray3">
              {summaryType}
            </span>
          ) : (
            <img
              src={visibility === "public" ? publicIcon : privateIcon}
              className="w-[24px] h-[24px] shrink-0"
              alt={visibility === "public" ? "공개" : "비공개"}
            />
          ))}
      </div>

      {/* 작성일 */}
      <div className="text-body-14-regular text-gray3">{createdAt}</div>
    </div>
  );
}
