/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_CLIENT_ID: string;
  // 카카오 SDK용 키(필수)
  readonly VITE_KAKAO_JS_SDK_KEY: string;
  // 배포 환경: local | dev | prod (필수)
  readonly VITE_ENV_TYPE: "local" | "dev" | "prod";
  // OAuth 리디렉트 URI (필수)
  readonly VITE_APP_REDIRECT_URI: string;
  // 기본 API 경로: 설정 없으면 '/api'로 폴백
  readonly VITE_API_BASE_URL?: string;
  // axios에서 폴백할 때 사용
  readonly VITE_BASE_URL?: string;
  // API 모킹 on/off
  readonly VITE_API_MOCKING?: "true" | "false";
  // 앱 제목 (SEO용)
  readonly VITE_APP_TITLE?: string;
  // 파비콘 경로
  readonly VITE_FAVICON?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "@toast-ui/editor" {
  export default class Editor {
    constructor(options: any);
    getMarkdown(): string;
    setMarkdown(markdown: string): void;
    addHook(type: string, handler: (...args: any[]) => void): void;
    // 필요한 다른 메서드들...
  }
}

declare module "@toast-ui/react-editor" {
  import type { Editor as EditorType } from "@toast-ui/editor";
  import { Component } from "react";

  export interface EditorProps {
    initialValue?: string;
    initialEditType?: "markdown" | "wysiwyg";
    previewStyle?: "tab" | "vertical";
    height?: string;
    usageStatistics?: boolean;
    onChange?: () => void;
    ref?: any;
  }

  export class Editor extends Component<EditorProps> {
    getInstance(): EditorType;
  }
}
