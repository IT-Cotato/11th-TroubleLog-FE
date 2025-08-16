interface ImportMetaEnv {
  readonly VITE_ENV_TYPE: "local" | "dev" | "prod";
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_REDIRECT_URI?: string;
  readonly VITE_API_MOCKING?: "true" | "false";
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
