import MDEditor from "@uiw/react-md-editor";
import alertIcon from "@/assets/icons/alerticon.svg";
import checkBoxIcon from "@/assets/icons/checkedbox.svg";
import nonCheckBoxIcon from "@/assets/icons/noncheckedbox.svg";

export interface BlockData {
  id: number;
  content: string;
  checklist: string[];
  checklistItems: string[];
  isSaved: boolean;
  question: string;
  checklistTitle: string;
}

interface Props {
  title: string;
  selectedErrorType: string | null;
  block: BlockData;
  index: number;
  onChange: (index: number, updated: Partial<BlockData>) => void;
  onToggleChecklist: (index: number, item: string, checked: boolean) => void;
  onAddBlock?: () => void;

  isActive: boolean;
  isLast: boolean;
  onEnd?: () => void;
  onShowSaveAlert?: () => void;
  onActivate: (index: number) => void;
}

const EditorBlock = ({
  block,
  index,
  onChange,
  onToggleChecklist,
  onAddBlock,
  onActivate,
  isActive,
  isLast,
  onEnd,
  title,
  selectedErrorType,
  onShowSaveAlert,
}: Props) => {
  return (
    <div
      className="flex flex-row gap-[25px] pb-[25px]"
      onClick={() => onActivate(index)}
    >
      <div className="flex flex-col gap-[16px] w-[1200px]">
        <div className="flex justify-between items-start">
          <span className="font-bold text-black text-[24px]">
            {block.question}
          </span>
          {isActive && (
            <div className="flex flex-col items-end gap-2 min-w-[160px]">
              <div className="flex gap-2">
                <button
                  onClick={() => onShowSaveAlert?.()}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-purple-500 hover:bg-gray-100"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    if (isLast) onEnd?.();
                    else onAddBlock?.();
                  }}
                  className={`px-4 py-2 rounded-xl text-sm ${
                    isLast
                      ? title.trim() && selectedErrorType
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-gray-300 text-white cursor-not-allowed"
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

      {/* 오른쪽 체크리스트 */}
      <div className="flex flex-col gap-2 mt-14">
        {block.checklistItems.length > 0 && (
          <h3 className="text-base font-semibold text-gray4 flex items-center gap-2">

            <img src={alertIcon} alt="alert icon" className="w-5 h-5" />

          
            {block.checklistTitle}
          </h3>
        )}

        {block.checklistItems.map((item) => (
          <label
            key={item}
            className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer"
          >
            <input
              type="checkbox"
              className="peer hidden"
              checked={block.checklist.includes(item)}
              onChange={(e) => onToggleChecklist(index, item, e.target.checked)}
            />
            <span
              style={{
                ["--icon-unchecked" as any]: `url("${nonCheckBoxIcon}")`,
                ["--icon-checked" as any]: `url("${checkBoxIcon}")`,
              }}
              className="
    inline-block w-5 h-5 bg-no-repeat bg-center bg-contain
    [background-image:var(--icon-unchecked)]
    peer-checked:[background-image:var(--icon-checked)]
  "
            ></span>
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default EditorBlock;
