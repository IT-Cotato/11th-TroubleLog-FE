import CardHeaderRight from "./CardHeaderRight";
import type { StatusType } from "@/types/project";

interface CardPreviewAreaProps {
  errorCategory: string;
  isMine: boolean;
  status: StatusType;
  authorProfileImageUrl?: string;
  onAvatarClick?: () => void;
  onRequestDelete?: () => void;
  deleting?: boolean;
}

export default function CardPreviewArea({
  errorCategory,
  isMine,
  status,
  authorProfileImageUrl,
  onAvatarClick,
  onRequestDelete,
  deleting,
}: CardPreviewAreaProps) {
  return (
    <div className="bg-gray1 rounded-2xl h-[170px] sm:h-[200px] md:h-[210px] xl:h-[220px] flex flex-col p-3 sm:p-4">
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
