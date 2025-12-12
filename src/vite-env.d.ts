/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENV: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_KAKAO_LOGIN_REST_API_KEY: string;
  readonly VITE_KAKAO_LOGIN_REDIRECT_URI: string;
  readonly VITE_GITHUB_LOGIN_CLIENT_ID: string;
  readonly VITE_GITHUB_LOGIN_REDIRECT_URI: string;
  readonly VITE_GITHUB_LOGIN_CLIENT_SECRET: string;
  readonly VITE_BASE_URL_DEV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "@toast-ui/editor" {
  export type { Editor };
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
