import "@toast-ui/editor/dist/toastui-editor.css";
import { Editor } from "@toast-ui/react-editor";
import type EditorInstance from "@toast-ui/editor";
import { useRef, useEffect, useCallback } from "react";
import { uploadImage } from "@/api/image.api";
import { useRemoveDefaultText } from "@/shared/hooks/useRemoveDefaultText";

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
  const editorRef = useRef<EditorInstance | null>(null);
  const hookedEditor = useRef<EditorInstance | null>(null);
  const removeDefaultText = useRemoveDefaultText(block.content);

  // ref 콜백을 useCallback으로 고정하여 불필요한 detach/attach 방지
  const handleEditorRef = useCallback(
    (editor: any | null) => {
      if (!editor) {
        editorRef.current = null;
        return;
      }
      const instance = editor.getInstance();
      editorRef.current = instance;

      // 인스턴스당 1회만 hook 등록
      if (hookedEditor.current === instance) return;
      hookedEditor.current = instance;

      // 이미지 업로드 훅 설정
      instance.addHook(
        "addImageBlobHook",
        async (
          blob: Blob,
          callback: (url: string, altText?: string) => void
        ) => {
          try {
            const file = blob as File;
            const url = await uploadImage(file);
            callback(url, "image");
          } catch {
            console.error("이미지 업로드에 실패했습니다.");
          }
        }
      );

      // 최초 세팅 시에만(또는 block.content가 비어있을 때만) 기본 텍스트 제거
      setTimeout(() => removeDefaultText(instance), 0);
    },
    [removeDefaultText]
  );

  // 외부 content 변경 동기화 (block.content가 외부에서 변경될 때)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentMarkdown = editor.getMarkdown();
    if (currentMarkdown !== block.content) {
      editor.setMarkdown(block.content);
    }
  }, [block.content]);

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
        <div className="w-full">
          <Editor
            ref={handleEditorRef}
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
    </div>
  );
};

export default EditorBlock;
