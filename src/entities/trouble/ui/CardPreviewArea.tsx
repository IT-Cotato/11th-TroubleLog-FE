import CardHeaderRight from "../../../components/Card/CardHeaderRight";
import type { StatusType } from "@/types/project";

interface CardPreviewAreaProps {
  errorCategory: string;
  isMine: boolean;
  status: StatusType;
  authorProfileImageUrl?: string;
  onAvatarClick?: () => void;
  onRequestDelete?: () => void;
  deleting?: boolean;
  imageUrl?: string;
}

export default function CardPreviewArea({
  errorCategory,
  isMine,
  status,
  authorProfileImageUrl,
  onAvatarClick,
  onRequestDelete,
  deleting,
  imageUrl,
}: CardPreviewAreaProps) {
  const hasImage = !!imageUrl;

  return (
    <div
      className={[
        // 공통 스타일
        "rounded-2xl h-[170px] sm:h-[200px] md:h-[210px] xl:h-[220px] flex flex-col p-3 sm:p-4",
        // 이미지 유무에 따라 배경 클래스 분기
        hasImage ? "bg-center bg-cover bg-no-repeat" : "bg-gray1",
      ].join(" ")}
      // 이미지가 있을 때만 backgroundImage 적용
      style={hasImage ? { backgroundImage: `url(${imageUrl})` } : undefined}
    >
      <div className="flex justify-between items-start gap-2 min-w-0">
        <span
          className="text-body-16-semibold truncate max-w-[65%] sm:max-w-[70%]"
          title={errorCategory}
        >
          [{errorCategory}]
        </span>
        <CardHeaderRight
          isMine={isMine}
          status={status}
          authorProfileImageUrl={authorProfileImageUrl}
          onAvatarClick={onAvatarClick}
          onDelete={onRequestDelete}
          deleting={deleting}
        />
      </div>
    </div>
  );
}
