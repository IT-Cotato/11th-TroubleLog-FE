import MDEditor, { type ICommand } from "@uiw/react-md-editor";
import alertIcon from "@/assets/icons/alerticon.svg";
import checkBoxIcon from "@/assets/icons/checkedbox.svg";
import nonCheckBoxIcon from "@/assets/icons/noncheckedbox.svg";
import { useLayoutEffect, useRef, useState, useEffect } from "react";

export interface BlockData {
  id: number;
  content: string;
  checklist: string[];
  checklistItems: string[];
  isSaved: boolean;
  question: string;
  checklistTitle: string;
}

export type EditorBlockProps = {
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
  onShowAlert?: () => void;
  onShowSaveAlert?: () => void;
  onSave?: () => Promise<boolean>;
  isSaving?: boolean;
  canSave?: boolean;
  onActivate: (index: number) => void;

  onPasteImage?: (
    blockId: number,
    e: React.ClipboardEvent<HTMLTextAreaElement>
  ) => void;
  onDropImage?: (
    blockId: number,
    e: React.DragEvent<HTMLTextAreaElement>
  ) => void;

  commandsFilter?: (command: ICommand, isExtra: boolean) => false | ICommand;
};

const MIN_H = 200;
const MAX_H = 2000;

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
  onShowAlert,
  onSave,
  isSaving,
  canSave,
  onPasteImage,
  onDropImage,
  commandsFilter,
}: EditorBlockProps) => {
  const [editorHeight, setEditorHeight] = useState<number>(MIN_H);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const autosizeToContent = () => {
    const ta = wrapRef.current?.querySelector(
      "textarea.w-md-editor-text-input"
    ) as HTMLTextAreaElement | null;
    if (!ta) return;
    ta.style.height = "auto";
    const needed = ta.scrollHeight;
    const next = Math.max(MIN_H, Math.min(MAX_H, needed + 24));
    setEditorHeight(next);
  };

  useLayoutEffect(() => {
    autosizeToContent();
    const t = setTimeout(autosizeToContent, 0);
    return () => clearTimeout(t);
  }, [block.content, isActive]);

  const applyWrapperHeight = () => {
    const h = wrapRef.current?.getBoundingClientRect().height;
    if (!h) return;
    setEditorHeight(Math.max(MIN_H, Math.min(MAX_H, Math.round(h))));
  };

  useEffect(() => {
    const ta = wrapRef.current?.querySelector(
      "textarea.w-md-editor-text-input"
    ) as HTMLTextAreaElement | null;
    if (!ta || !("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(autosizeToContent);
    });
    ro.observe(ta);
    return () => ro.disconnect();
  }, []);

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
                {/* Save */}
                <button
                  disabled={!!isSaving || !canSave}
                  onClick={async () => {
                    try {
                      if (!canSave) {
                        onShowAlert?.();
                        return;
                      }
                      if (!onSave) {
                        onShowAlert?.();
                        return;
                      }
                      const ok = await onSave();
                      if (ok) onShowSaveAlert?.();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className={`px-4 py-2 border rounded-xl text-sm ${
                    isSaving || !canSave
                      ? "border-gray-200 text-gray-300 cursor-not-allowed"
                      : "border-gray-200 text-purple-500 hover:bg-gray-100"
                  }`}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>

                {/* Next/End */}
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
          <div
            ref={wrapRef}
            className="resize-y overflow-visible rounded-[8px] border border-gray-200"
            style={{ minHeight: MIN_H, maxHeight: MAX_H, height: editorHeight }}
            onMouseUp={applyWrapperHeight}
            onTouchEnd={applyWrapperHeight}
          >
            <MDEditor
              value={block.content}
              onChange={(val) => {
                onChange(index, { content: val || "" });
                setTimeout(autosizeToContent, 0);
              }}
              height={editorHeight}
              preview={isActive ? "edit" : "preview"}
              style={{ width: "1200px", border: "none" }}
              autoFocus={isActive}
              commandsFilter={commandsFilter}
              textareaProps={{
                onPaste: (e) => onPasteImage?.(block.id, e),
                onDrop: (e) => onDropImage?.(block.id, e),
                onDragOver: (e) => {
                  // 드래그 파일 드롭 허용
                  if (e.dataTransfer?.types?.includes("Files"))
                    e.preventDefault();
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-14">
        {block.checklistItems.length > 0 && (
          <h3 className="text-base font-semibold text-gray4 flex items-center gap-2">
            <img src={alertIcon} alt="alert icon" className="w-5 h-5" />
            {block.checklistTitle}
          </h3>
        )}
        {block.checklistItems.map((item: string) => (
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
              className="inline-block w-5 h-5 bg-no-repeat bg-center bg-contain
                         [background-image:var(--icon-unchecked)]
                         peer-checked:[background-image:var(--icon-checked)]"
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default EditorBlock;
