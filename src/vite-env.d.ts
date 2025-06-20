/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_REST_API_KEY: string;
  readonly VITE_APP_REDIRECT_URI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
