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
