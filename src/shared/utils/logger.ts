/**
 * 로깅 유틸리티
 * 개발 환경에서만 로그를 출력하고, 프로덕션에서는 제거됨
 */

const isDev = import.meta.env.DEV;

/**
 * 개발 환경에서만 로그를 출력합니다.
 * 프로덕션 빌드에서는 제거됩니다.
 */
export const devLog = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
};

/**
 * 에러 로그 (프로덕션에서도 출력)
 * 실제 에러 발생 시 디버깅을 위해 사용
 */
export const errorLog = {
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
