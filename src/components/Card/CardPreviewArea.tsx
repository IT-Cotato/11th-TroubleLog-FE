import CardHeaderRight from "./CardHeaderRight";
import type { StatusType } from "@/types/project";

interface CardPreviewAreaProps {
  errorCategory: string;
  isMine: boolean;
  status: StatusType;
  authorProfileImageUrl?: string;
}

export default function CardPreviewArea({
  errorCategory,
  isMine,
  status,
  authorProfileImageUrl,
}: CardPreviewAreaProps) {
  return (
    <div
      className="bg-gray1 rounded-2xl h-[180px] sm:h-[210px]
 flex flex-col p-3 sm:p-4
"
    >
      <div className="flex justify-between items-start">
        <span className="text-body-16-semibold">[{errorCategory}]</span>
        <CardHeaderRight
          isMine={isMine}
          status={status}
          authorProfileImageUrl={authorProfileImageUrl}
        />
      </div>
    </div>
  );
}
