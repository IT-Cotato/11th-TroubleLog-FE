interface CardTitleSectionProps {
  title: string;
  visibility: "public" | "private";
  createdAt: string;
  isMine: boolean;
}

export default function CardTitleSection({
  title,
  visibility,
  createdAt,
  isMine,
}: CardTitleSectionProps) {
  return (
    <div className="gap-2">
      {/* 제목 + 공개 여부 아이콘 */}
      <div className="flex items-start gap-2">
        <div className="text-head-20-semibold truncate overflow-hidden whitespace-nowrap max-w-[250px]">
          {title}
        </div>
        {isMine && (
          <img
            src={
              visibility === "public"
                ? "/icons/public.svg"
                : "/icons/private.svg"
            }
            className="w-[24px] h-[24px]"
            alt={visibility === "public" ? "공개" : "비공개"}
          />
        )}
      </div>
      {/* 작성일 */}
      <div className="text-body-14-regular text-gray3">{createdAt}</div>
    </div>
  );
}
