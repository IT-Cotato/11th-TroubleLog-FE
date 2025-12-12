import "@toast-ui/editor/dist/toastui-editor.css";
import { Editor } from "@toast-ui/react-editor";
import type EditorInstance from "@toast-ui/editor";
import { useRef, useEffect, useCallback } from "react";
import { uploadImage } from "@/api/image.api";

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

  // 에디터 내부 기본 텍스트 제거 함수
  const removeDefaultText = useCallback((editor: EditorInstance) => {
    try {
      const currentMarkdown = editor.getMarkdown();
      const defaultTexts = ["Write", "Preview", "Markdown", "WYSIWYG"];
      const trimmedMarkdown = currentMarkdown.trim();

      // 기본 텍스트만 있거나, 기본 텍스트로 시작하는 경우 제거
      if (defaultTexts.some((defaultText) => trimmedMarkdown === defaultText)) {
        editor.setMarkdown("");
      } else if (
        defaultTexts.some((defaultText) =>
          trimmedMarkdown.startsWith(defaultText)
        )
      ) {
        // 기본 텍스트로 시작하는 경우도 제거
        const lines = trimmedMarkdown.split("\n");
        if (lines.length > 0 && defaultTexts.includes(lines[0].trim())) {
          editor.setMarkdown("");
        }
      }
    } catch {
      // 에러 발생 시 무시
    }
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

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
    removeDefaultText(editor);
    const timer = setTimeout(() => removeDefaultText(editor), 100);
    const timer2 = setTimeout(() => removeDefaultText(editor), 500);
    const timer3 = setTimeout(() => removeDefaultText(editor), 1000);
    const timer4 = setTimeout(() => removeDefaultText(editor), 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [removeDefaultText]);

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
            ref={(editor) => {
              if (editor) {
                const instance = editor.getInstance();
                editorRef.current = instance;

                // 에디터 인스턴스가 설정되는 즉시 기본 텍스트 제거
                setTimeout(() => {
                  removeDefaultText(instance);
                }, 0);
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
    </div>
  );
};

export default EditorBlock;
