import MDEditor, { type ICommand } from "@uiw/react-md-editor";
import alertIcon from "@/assets/icons/alerticon.svg";
import checkBoxIcon from "@/assets/icons/checkedbox.svg";
import nonCheckBoxIcon from "@/assets/icons/noncheckedbox.svg";
import {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";

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
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

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
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // 콘텐츠 길이에 따라 자동 높이 조절 (textarea.style.height 직접 조작 X)
  const autosize = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    const next = clamp(ta.scrollHeight + 2, MIN_H, MAX_H);
    setEditorHeight((h) => (h !== next ? next : h));
  }, []);

  // 콘텐츠/활성 변경 시 한 프레임 뒤에 측정
  useLayoutEffect(() => {
    const id = requestAnimationFrame(autosize);
    return () => cancelAnimationFrame(id);
  }, [block.content, isActive, autosize]);

  // 입력 중 높이 변동 감지 (선택적)
  useEffect(() => {
    const ta = taRef.current;
    if (!ta || !("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(() => requestAnimationFrame(autosize));
    ro.observe(ta);
    return () => ro.disconnect();
  }, [autosize]);

  return (
    <div
      className="w-full flex flex-col md:flex-row gap-4 md:gap-6 pb-6"
      onClick={() => onActivate(index)}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-4 md:gap-5">
        {/* 질문 + 액션 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <span className="font-bold text-black text-lg sm:text-xl md:text-2xl">
            {block.question}
          </span>

          {isActive && (
            <div className="flex sm:justify-end gap-2">
              <button
                disabled={!!isSaving || !canSave}
                onClick={async () => {
                  try {
                    if (!canSave || !onSave) return onShowAlert?.();
                    const ok = await onSave();
                    if (ok) onShowSaveAlert?.();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className={`px-3 py-2 border rounded-xl text-sm ${
                  isSaving || !canSave
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-200 text-purple-500 hover:bg-gray-100"
                }`}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => {
                  if (isLast) onEnd?.();
                  else onAddBlock?.();
                }}
                className={`px-3 py-2 rounded-xl text-sm ${
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
          )}
        </div>

        {/* 편집 / 프리뷰 분리 렌더 → caret/height 안정 */}
        {isActive ? (
          <div
            className="w-full overflow-visible rounded-md border border-gray-200"
            style={{ minHeight: MIN_H, maxHeight: MAX_H, height: editorHeight }}
          >
            <MDEditor
              value={block.content}
              onChange={(val) => {
                onChange(index, { content: val || "" });
                requestAnimationFrame(autosize);
              }}
              height={editorHeight}
              preview="edit"
              visiableDragbar={false}
              style={{ width: "100%", border: "none" }}
              autoFocus
              commandsFilter={commandsFilter}
              textareaProps={{
                // v4.0.7: 타입에 ref 정의가 없어 단언 사용
                ...({
                  ref: (el: HTMLTextAreaElement | null) => {
                    taRef.current = el;
                    requestAnimationFrame(autosize); // 초기 한 번 계산
                  },
                } as any),
                onInput: () => requestAnimationFrame(autosize),
                onPaste: (e) => {
                  onPasteImage?.(block.id, e);
                  requestAnimationFrame(autosize);
                },
                onDrop: (e) => {
                  onDropImage?.(block.id, e);
                  requestAnimationFrame(autosize);
                },
                onDragOver: (e) => {
                  if (e.dataTransfer?.types?.includes("Files"))
                    e.preventDefault();
                },
              }}
            />
          </div>
        ) : (
          <div className="w-full rounded-md border border-gray-200 p-3">
            <MDEditor.Markdown source={block.content || ""} />
          </div>
        )}
      </div>

      {/* 체크리스트 */}
      <div className="w-full md:w-60 lg:w-72 mt-2 md:mt-10 flex-shrink-0">
        <div className="flex flex-col gap-2">
          {block.checklistItems.length > 0 && (
            <h3 className="text-sm md:text-base font-semibold text-gray4 flex items-center gap-2">
              <img src={alertIcon} alt="alert icon" className="w-5 h-5" />
              {block.checklistTitle}
            </h3>
          )}
          <div className="flex flex-col gap-2">
            {block.checklistItems.map((item) => (
              <label
                key={item}
                className="flex items-start gap-2 cursor-pointer text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  className="peer hidden"
                  checked={block.checklist.includes(item)}
                  onChange={(e) =>
                    onToggleChecklist(index, item, e.target.checked)
                  }
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
                <span className="leading-5">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorBlock;
