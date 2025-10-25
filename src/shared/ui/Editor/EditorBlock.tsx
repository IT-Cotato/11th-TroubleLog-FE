import MDEditor, { type ICommand } from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

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
  checklistWidthClass?: string;
  nowrapChecklistItems?: boolean;

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
const MAX_H = 20000;
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
  checklistWidthClass,
  nowrapChecklistItems,
}: EditorBlockProps) => {
  const [editorHeight, setEditorHeight] = useState<number>(MIN_H);

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const editorWrapRef = useRef<HTMLDivElement | null>(null);

  const autosize = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    const prevTaH = ta.style.height;
    ta.style.height = "auto";

    const taScrollH = ta.scrollHeight;

    const editorRoot = ta.closest(".w-md-editor") as HTMLElement | null;
    const toolbar = editorRoot?.querySelector(
      ".w-md-editor-toolbar"
    ) as HTMLElement | null;
    const bottombar = editorRoot?.querySelector(
      ".w-md-editor-bar"
    ) as HTMLElement | null;

    const toolbarH = toolbar?.offsetHeight ?? 0;
    const bottombarH = bottombar?.offsetHeight ?? 0;

    // textarea
    const taCS = getComputedStyle(ta);
    const taVPad =
      (parseFloat(taCS.paddingTop || "0") || 0) +
      (parseFloat(taCS.paddingBottom || "0") || 0);

    // textarea 부모
    const taWrap = ta.parentElement as HTMLElement | null;
    const wrapCS = taWrap ? getComputedStyle(taWrap) : null;
    const wrapVPad = wrapCS
      ? (parseFloat(wrapCS.paddingTop || "0") || 0) +
        (parseFloat(wrapCS.paddingBottom || "0") || 0)
      : 0;

    // 에디터 루트 보더/패딩
    const rootCS = editorRoot ? getComputedStyle(editorRoot) : null;
    const rootVPad =
      (rootCS ? parseFloat(rootCS.paddingTop || "0") : 0) +
      (rootCS ? parseFloat(rootCS.paddingBottom || "0") : 0);
    const rootVBorder =
      (rootCS ? parseFloat(rootCS.borderTopWidth || "0") : 0) +
      (rootCS ? parseFloat(rootCS.borderBottomWidth || "0") : 0);

    // 여유분(렌더 오차/간격용)
    const fudge = 16;

    const chrome =
      toolbarH +
      bottombarH +
      taVPad +
      wrapVPad +
      rootVPad +
      rootVBorder +
      fudge;

    const next = clamp(taScrollH + chrome, MIN_H, MAX_H);
    setEditorHeight((h) => (h === next ? h : next));

    ta.style.height = prevTaH;
  }, []);

  const attachTextareaRef = useCallback(() => {
    if (taRef.current) return;
    const root = editorWrapRef.current;
    if (!root) return;

    const ta = root.querySelector("textarea") as HTMLTextAreaElement | null;

    if (ta) {
      taRef.current = ta;
      requestAnimationFrame(autosize);
    }
  }, [autosize]);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      attachTextareaRef();
      autosize();
    });
    return () => cancelAnimationFrame(id);
  }, [attachTextareaRef, autosize, isActive, block.content]);

  useEffect(() => {
    const target = editorWrapRef.current;
    if (!target || !("ResizeObserver" in window)) return;

    const ro = new ResizeObserver(() => requestAnimationFrame(autosize));
    ro.observe(target);
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
                // disabled 속성 제거
                onClick={async () => {
                  try {
                    if (!canSave || !onSave) {
                      // 제목 미입력 등 저장 불가 조건일 때 알림 표시
                      onShowAlert?.();
                      return;
                    }
                    const ok = await onSave();
                    if (ok) onShowSaveAlert?.();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className={`px-3 py-2 border rounded-xl text-sm ${
                  isSaving
                    ? "border-gray-200 text-gray-300 cursor-wait"
                    : !canSave
                    ? "border-gray-200 text-gray-400 hover:bg-gray-50 cursor-pointer"
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

        {/* 편집 / 프리뷰 분리 */}
        {isActive ? (
          <div
            ref={editorWrapRef}
            className="w-full overflow-visible rounded-md border border-gray-200"
          >
            <MDEditor
              value={block.content}
              data-color-mode="light"
              onChange={(val) => {
                onChange(index, { content: val || "" });
                requestAnimationFrame(autosize);
              }}
              height={editorHeight}
              preview="edit"
              visibleDragbar={false}
              style={{
                width: "100%",
                border: "none",
                overflow: "visible",
                minHeight: `${editorHeight}px`,
                maxHeight: "none",
              }}
              autoFocus
              commandsFilter={commandsFilter}
              textareaProps={{
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
          <div className="w-full rounded-md border border-gray-200 p-3 min-h-[150px]">
            <MDEditor.Markdown
              source={block.content || ""}
              data-color-mode="light"
              className="!bg-white !text-black wmde-markdown-light"
            />
          </div>
        )}
      </div>

      {/* 체크리스트 */}
      <div
        className={[
          "w-full mt-2 md:mt-10 flex-shrink-0 md:basis-[320px] lg:basis-[380px] xl:basis-[440px] md:max-w-[480px]",
          checklistWidthClass ?? "",
        ].join(" ")}
      >
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
                <span
                  className={[
                    "leading-5",
                    nowrapChecklistItems
                      ? "whitespace-nowrap overflow-hidden text-ellipsis"
                      : "",
                  ].join(" ")}
                  title={item}
                >
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorBlock;
