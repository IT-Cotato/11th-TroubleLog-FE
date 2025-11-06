import MDEditor from "@uiw/react-md-editor";

export interface BlockData {
  id: number;
  title: string;
  content: string;
  isSaved: boolean;
}

interface Props {
  block: BlockData;
  index: number;
  onChange: (index: number, updated: Partial<BlockData>) => void;
  onAddBlock?: () => void;
  onSave?: (index: number) => void;
  isActive: boolean;
  isLast: boolean;
  onEnd?: () => void;
  isEndDisabled?: boolean;
}

const EditorBlock = ({
  block,
  index,
  onChange,
  onAddBlock,
  onSave,
  isActive,
  isLast,
  onEnd,
  isEndDisabled = false,
}: Props) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pb-6">
      <div className="flex flex-col gap-4 w-full max-w-screen-lg mx-auto">
        {/* 타이틀 + 액션바 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <input
            type="text"
            value={block.title}
            onChange={(e) => onChange(index, { title: e.target.value })}
            placeholder="소제목을 입력해주세요."
            className="w-full p-2 border-none rounded font-bold text-black text-xl sm:text-2xl"
          />

          {isActive && (
            <div className="flex w-full sm:w-auto justify-end">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0 sm:min-w-[160px]">
                <button
                  onClick={() => onSave?.(index)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 w-full sm:w-auto"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    if (isLast) onEnd?.();
                    else onAddBlock?.();
                  }}
                  disabled={isLast && isEndDisabled}
                  className={`px-4 py-2 rounded-lg text-sm w-full sm:w-auto ${
                    isLast
                      ? isEndDisabled
                        ? "bg-gray-300 text-white cursor-not-allowed"
                        : "bg-purple-500 text-white hover:bg-purple-600"
                      : "bg-purple-500 text-white hover:bg-purple-600"
                  }`}
                >
                  {isLast ? "End" : "Next"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 에디터 */}
        <div data-color-mode="light" className="w-full">
          <MDEditor
            value={block.content}
            onChange={(val) => onChange(index, { content: val || "" })}
            preview={isActive ? "edit" : "preview"}
            height={isActive ? 300 : 300}
            autoFocus={isActive}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default EditorBlock;
