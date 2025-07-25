import React from "react";
import MDEditor from "@uiw/react-md-editor";

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
  block: BlockData;
  index: number;
  onChange: (index: number, updated: Partial<BlockData>) => void;
  onToggleChecklist: (index: number, item: string, checked: boolean) => void;
  onAddBlock?: () => void;
  onSave?: (index: number) => void;
  isActive: boolean;
  isLast: boolean;
  onEnd?: () => void;
}

const EditorBlock = ({
  block,
  index,
  onChange,
  onToggleChecklist,
  onAddBlock,
  onSave,
  isActive,
  isLast,
  onEnd,
}: Props) => {
  return (
    <div className="flex flex-row gap-[25px] pb-[25px]">
      <div className="flex flex-col gap-[16px] w-[1200px]">
        <div className="flex justify-between items-start">
          <span className="font-bold text-black text-[24px]">
            {block.question}
          </span>
          {isActive && (
            <div className="flex flex-col items-end gap-2 min-w-[160px]">
              {block.isSaved && (
                <div className="inline-flex gap-[5px] px-[16px] justify-center bg-white shadow-2xs  items-center rounded-lg ">
                  <img src="/src/assets/images/checkicon.svg" />
                  <p className="text-14-black"> 저장되었습니다.</p>
                </div>
              )}
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
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
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
            <img
              src="src/assets/images/alerticon.svg"
              alt="alert icon"
              className="w-5 h-5"
            />
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
              className={`
        inline-block w-5 h-5 bg-no-repeat bg-center bg-contain
        peer-checked:bg-[url('src/assets/images/checkedbox.svg')]
        bg-[url('src/assets/images/noncheckedbox.svg')]
      `}
            ></span>
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default EditorBlock;
