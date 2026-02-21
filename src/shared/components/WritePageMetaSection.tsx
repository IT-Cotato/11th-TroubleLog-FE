import type { RefObject } from "react";
import DropDownButton from "@/shared/ui/Button/DropDownButton";
import CategoryTag from "@/shared/ui/Editor/CategoryTag";

export interface WritePageMetaSectionProps {
  title: string;
  onTitleChange: (v: string) => void;
  titleRef?: RefObject<HTMLInputElement | null>;
  projectNames: string[];
  projectsLoading: boolean;
  selectedProjectId: number | null;
  onProjectSelect: (id: number | null) => void;
  projectNameById: (id?: number | null) => string;
  nameToId: Map<string, number>;
  errorOptions: string[];
  selectedErrorType: string | null;
  onErrorTypeSelect: (v: string | null) => void;
  selectedTags: string[];
  onTagsChange: React.Dispatch<React.SetStateAction<string[]>>;
  /** 우측 액션(예: 작성 완료 버튼). FreeForm 등에서 사용 */
  actions?: React.ReactNode;
}

const TITLE_CLASS =
  "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black outline-none leading-tight whitespace-pre-wrap break-words relative border-none bg-transparent";

export function WritePageMetaSection({
  title,
  onTitleChange,
  titleRef,
  projectNames,
  projectsLoading,
  selectedProjectId,
  onProjectSelect,
  projectNameById,
  nameToId,
  errorOptions,
  selectedErrorType,
  onErrorTypeSelect,
  selectedTags,
  onTagsChange,
  actions,
}: WritePageMetaSectionProps) {
  const metaContent = (
    <>
      <div className="flex gap-3 items-center flex-wrap">
        <DropDownButton
          options={projectNames}
          placeholder={
            projectsLoading
              ? "프로젝트 불러오는 중..."
              : projectNameById(selectedProjectId) || "프로젝트를 선택하세요"
          }
          width="w-full sm:w-[170px] md:w-[190px]"
          onSelect={(name: string) =>
            onProjectSelect(nameToId.get(name) ?? null)
          }
        />
        <DropDownButton
          options={errorOptions}
          placeholder={selectedErrorType ?? "에러 종류를 선택하세요"}
          width="w-full sm:w-[180px] lg:w-[220px]"
          onSelect={onErrorTypeSelect}
        />
      </div>
      <div className="w-full sm:w-auto min-w-[180px]">
        <CategoryTag value={selectedTags} onChange={onTagsChange} />
      </div>
    </>
  );

  return (
    <div className="flex flex-col items-start gap-6 sm:gap-10">
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="제목을 입력하세요."
        className={`w-full max-w-full md:max-w-[870px] ${TITLE_CLASS}`}
      />
      <div className="flex flex-col gap-3 max-w-[900px] md:max-w-[1100px] lg:w-auto">
        {actions ? (
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-3 max-w-[900px] md:max-w-[1100px] lg:w-auto">
              {metaContent}
            </div>
            <div className="flex gap-2 w-full lg:w-auto">
              {actions}
            </div>
          </div>
        ) : (
          metaContent
        )}
      </div>
    </div>
  );
}
