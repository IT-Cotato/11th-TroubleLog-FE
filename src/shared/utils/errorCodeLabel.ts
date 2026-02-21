/** 에러 코드 → 표시 라벨 매핑 (TempWrite/FreeFormWrite 공통) */
export const ERROR_CODE_TO_LABEL: Record<string, string> = {
  BUILD_COMPILE_ERROR: "Build/Compile Error",
  RUNTIME_ERROR: "Runtime Error",
  DEPENDENCY_VERSION_ERROR: "Dependency/Version Error",
  NETWORK_API_ERROR: "Network/API Error",
  AUTHENTICATION_AUTHORIZATION_ERROR: "Authentication/Authorization Error",
  DATABASE_ERROR: "Database Error",
  UI_RENDERING_ERROR: "UI/Rendering Error",
  CONFIGURATION_ERROR: "Configuration Error",
  TIMEOUT_ERROR_HANDLING: "Timeout/Error Handling",
  THIRD_PARTY_LIBRARY_ERROR: "Third-Party Library Error",
};

/** 에러 코드 → 표시용 라벨 (없으면 코드 그대로) */
export const toErrorLabel = (code?: string | null) =>
  code ? ERROR_CODE_TO_LABEL[code] ?? code : null;

/** 에러 선택 드롭다운용 옵션 목록 */
export const ERROR_OPTIONS = Object.values(ERROR_CODE_TO_LABEL);
