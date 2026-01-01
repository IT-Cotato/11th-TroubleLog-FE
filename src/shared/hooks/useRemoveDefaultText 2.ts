import { useRef, useCallback } from "react";
import type EditorInstance from "@toast-ui/editor";

/**
 * Toast UI Editor의 기본 텍스트("Write", "Preview", "Markdown", "WYSIWYG")를 제거하는 훅
 * 초기값이 비어있을 때만 1회 실행되도록 가드가 포함되어 있습니다.
 *
 * @param initialContent - 에디터의 초기 콘텐츠 (비어있을 때만 기본 텍스트 제거)
 * @returns removeDefaultText 함수
 */
export function useRemoveDefaultText(initialContent: string) {
  const hasRemovedRef = useRef(false);

  const removeDefaultText = useCallback(
    (editor: EditorInstance) => {
      // 이미 초기값이 있으면 절대 지우지 않기 (데이터 손실 방지)
      if ((initialContent ?? "").trim().length > 0) {
        return;
      }

      // 이미 실행했으면 다시 실행하지 않음 (1회만 실행)
      if (hasRemovedRef.current) {
        return;
      }

      try {
        const currentMarkdown = editor.getMarkdown();
        const defaultTexts = ["Write", "Preview", "Markdown", "WYSIWYG"];
        const trimmedMarkdown = currentMarkdown.trim();

        // 기본 텍스트만 있거나, 기본 텍스트로 시작하는 경우 제거
        const isDefaultText =
          defaultTexts.some((defaultText) => trimmedMarkdown === defaultText) ||
          (defaultTexts.some((defaultText) =>
            trimmedMarkdown.startsWith(defaultText)
          ) &&
            trimmedMarkdown.split("\n").length > 0 &&
            defaultTexts.includes(trimmedMarkdown.split("\n")[0].trim()));

        if (isDefaultText) {
          editor.setMarkdown("");
          hasRemovedRef.current = true; // 1회만 실행되도록 표시
        }
      } catch {
        // 에러 발생 시 무시
      }
    },
    [initialContent]
  );

  return removeDefaultText;
}
