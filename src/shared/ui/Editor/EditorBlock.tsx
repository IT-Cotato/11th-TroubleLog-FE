import "@toast-ui/editor/dist/toastui-editor.css";
import { Editor } from "@toast-ui/react-editor";
import type EditorInstance from "@toast-ui/editor";
import { uploadImage } from "@/api/image.api";
import { useRemoveDefaultText } from "@/shared/hooks/useRemoveDefaultText";

import alertIcon from "@/assets/icons/alerticon.svg";
import checkBoxIcon from "@/assets/icons/checkedbox.svg";
import nonCheckBoxIcon from "@/assets/icons/noncheckedbox.svg";
import { useRef, useEffect } from "react";

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
};

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
  onPasteImage: _onPasteImage,
  onDropImage: _onDropImage,
  checklistWidthClass,
  nowrapChecklistItems,
}: EditorBlockProps) => {
  // Toast UI Editor handles image uploads internally via addImageBlobHook
  // These props are kept for type compatibility but are no longer used
  void _onPasteImage;
  void _onDropImage;

  const editorRef = useRef<EditorInstance | null>(null);
  const removeDefaultText = useRemoveDefaultText(block.content);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // 이미지 업로드 훅 설정
    editor.addHook(
      "addImageBlobHook",
      async (blob: Blob, callback: (url: string, altText?: string) => void) => {
        try {
          const file = blob as File;
          const url = await uploadImage(file);
          callback(url, "image");
        } catch {
          console.error("이미지 업로드에 실패했습니다.");
        }
      }
    );

    // 초기 실행 및 지연 실행 (에디터 렌더링 완료 대기)
    // 초기값이 비어있을 때만 실행되며, 1회만 실행됨
    removeDefaultText(editor);
    const timer = setTimeout(() => removeDefaultText(editor), 100);
    const timer2 = setTimeout(() => removeDefaultText(editor), 500);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [removeDefaultText]);

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
        <div className="w-full rounded-md border border-gray-200">
          <Editor
            ref={(editor) => {
              if (editor) {
                editorRef.current = editor.getInstance();
              } else {
                editorRef.current = null;
              }
            }}
            initialValue={block.content || ""}
            onChange={() => {
              const editor = editorRef.current;
              if (editor) {
                const markdown = editor.getMarkdown();
                onChange(index, { content: markdown });
              }
            }}
            height="300px"
            initialEditType="markdown"
            previewStyle="vertical"
            usageStatistics={false}
          />
        </div>
      </div>

      {/* 체크리스트 */}
      <div
        className={[
          "w-full mt-6 md:mt-14 flex-shrink-0 md:basis-[200px] lg:basis-[250px] xl:basis-[300px] md:max-w-[300px]",
          checklistWidthClass ?? "",
        ].join(" ")}
      >
        <div className="flex flex-col gap-2">
          {block.checklistItems.length > 0 && (
            <h3 className="text-xs sm:text-base font-semibold text-gray4 flex items-center gap-2">
              <img src={alertIcon} alt="alert icon" className="w-4 h-4" />
              {block.checklistTitle}
            </h3>
          )}
          <div className="flex flex-col gap-1">
            {block.checklistItems.map((item) => (
              <label
                key={item}
                className="flex items-start gap-1 cursor-pointer text-xs text-gray-700"
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
                  className="inline-block w-4 h-4 bg-no-repeat bg-center bg-contain
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
