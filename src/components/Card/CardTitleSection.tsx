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
      <div className="flex items-start gap-1 sm:gap-2">
        <div className="truncate overflow-hidden whitespace-nowrap max-w-[160px] sm:max-w-[250px] text-head-20-semibold">
          {title}
        </div>

        {isMine &&
          (status === "created" && summaryType ? (
            <span className="text-body-16-regular text-gray3">
              {summaryType}
            </span>
          ) : (
            <img
              src={
                visibility === "public"
                  ? "/icons/public.svg"
                  : "/icons/private.svg"
              }
              className="w-[24px] h-[24px]"
              alt={visibility === "public" ? "공개" : "비공개"}
            />
          ))}
      </div>
      {/* 작성일 */}
      <div className="text-body-14-regular text-gray3">{createdAt}</div>
    </div>
  );
}
