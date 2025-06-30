/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_JS_SDK_KEY: string;
  readonly VITE_APP_REDIRECT_URI: string;
  readonly VITE_KAKAO_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
