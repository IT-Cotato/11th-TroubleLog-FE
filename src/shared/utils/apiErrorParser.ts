export interface ParsedApiError {
  status?: number;
  message: string;
}

/**
 * API 에러 응답을 { status, message } 형태로 파싱
 */
export function parseApiError(err: unknown): ParsedApiError {
  const anyErr = err as {
    response?: { status?: number; data?: { error?: { message?: string }; message?: string } };
    message?: string;
    status?: number;
  };
  const status = anyErr?.response?.status;
  const message =
    anyErr?.response?.data?.error?.message ??
    anyErr?.response?.data?.message ??
    anyErr?.message ??
    "요청 처리 중 오류가 발생했어요.";
  return { status, message };
}
