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
    <div className="flex flex-row gap-[25px] pb-[25px]">
      <div className="flex flex-col gap-[16px] w-[1200px]">
        <div className="flex justify-between items-start">
          <input
            type="text"
            value={block.title}
            onChange={(e) => onChange(index, { title: e.target.value })}
            placeholder="소제목을 입력해주세요."
            className="w-full p-2 border-none rounded font-bold text-black text-[24px]"
          />

          {isActive && (
            <div className="flex flex-col items-end gap-2 min-w-[160px]">
              <div className="flex gap-2">
                <button
                  onClick={() => onSave?.(index)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    if (isLast) onEnd?.();
                    else onAddBlock?.();
                  }}
                  disabled={isLast && isEndDisabled}
                  className={`px-4 py-2 rounded-lg text-sm ${
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

        <div data-color-mode="light">
          <MDEditor
            value={block.content}
            onChange={(val) => onChange(index, { content: val || "" })}
            height={240}
            preview={isActive ? "edit" : "preview"}
            style={{ width: "1200px" }}
            autoFocus={isActive}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorBlock;
