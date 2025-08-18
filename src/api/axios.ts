import axios, { AxiosError } from "axios";
import { router } from "@/routes/Router";
import { PATH } from "@/constants/paths";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  ""
);
if (!API_BASE_URL) {
  console.warn(
    "[API] VITE_API_BASE_URL가 비었습니다. SSE 등은 절대 URL을 만들 수 없습니다."
  );
}

const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_BASE_URL ?? "";

const getOriginSafely = (maybeUrl?: string | null): string => {
  try {
    if (maybeUrl && /^https?:\/\//i.test(maybeUrl)) {
      return new URL(maybeUrl).origin;
    }
  } catch {
    /* noop: relative URL or invalid format */
  }
  // '/api' 같은 상대 경로일 때는 현재 오리진으로 간주
  return window.location.origin;
};

const COMPUTED_BASE_URL = RAW_BASE_URL || "/api";
const API_ORIGIN = getOriginSafely(COMPUTED_BASE_URL);
const ENVTYPE = import.meta.env.VITE_ENV_TYPE;

// 타입 보강: 요청단위로 전역 404 스킵할 수 있게
declare module "axios" {
  export interface AxiosRequestConfig {
    __skipGlobal404?: boolean;
    __skipGlobalAuthGuard?: boolean;
    _retry?: boolean;
  }
}

const api = axios.create({
  // baseURL: COMPUTED_BASE_URL,
  baseURL: API_BASE_URL || undefined,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    EnvType: ENVTYPE,
  },
});

let navigating404 = false;

// 공통 유틸: 로그인 페이지로의 네비게이션을 1회만
let authNavigationPromise: Promise<void> | null = null;
const getCurrentSpaPath = () => {
  // 라우터가 있으면 라우터 위치를 우선 사용
  const loc: Location | (typeof router)["state"]["location"] =
    (router as any)?.state?.location ?? window.location;
  return `${loc.pathname}${loc.search}${loc.hash}`;
};

// 401/403 공통: 안내 화면으로 1회만 이동
const navigateToAuthGuardOnce = (status: 401 | 403, rawNext?: string) => {
  if (!authNavigationPromise) {
    const nextPath = rawNext ?? getCurrentSpaPath();
    const params = new URLSearchParams();
    params.set("status", String(status));
    params.set("next", nextPath);
    router.navigate(`${PATH.AUTH_GUARD}?${params.toString()}`, {
      replace: true,
    });
    authNavigationPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        authNavigationPromise = null;
        resolve();
      }, 300);
    });
  }
  return authNavigationPromise;
};

// 요청 인터셉터: 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const url = config.url ?? "";
  config.headers = config.headers ?? {};

  // 외부 절대 URL은 내부 인증/EnvType 헤더 미부착
  const isAbsolute = /^https?:\/\//i.test(url);
  const reqOrigin = isAbsolute ? getOriginSafely(url) : API_ORIGIN;
  const isExternalAbsolute = isAbsolute && reqOrigin !== API_ORIGIN;
  if (isExternalAbsolute) {
    return config;
  }

  // 모든 내부 요청(리프레시 포함)에 Authorization 부착
  const token = localStorage.getItem("accessToken");
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // EnvType은 항상 강제(리프레시 포함)
  if ((config.headers as any).EnvType == null) {
    (config.headers as any).EnvType = ENVTYPE;
  }
  return config;
});

// 리프레시 공용 Promise (동시 401 한 번만 처리)
let refreshPromise: Promise<string | null> | null = null;
const startRefresh = async (): Promise<string | null> => {
  try {
    const r = await api.post("/auth/refresh", { __skipGlobalAuthGuard: true });
    const newToken: string | undefined = r.data?.data?.accessToken;
    if (!newToken) {
      console.error("[Auth] Refresh response missing accessToken:", r.data);
      return null;
    }
    localStorage.setItem("accessToken", newToken);
    return newToken;
  } catch {
    return null;
  }
};

// 응답 인터셉터
api.interceptors.response.use(
  (res) => {
    const ct = res.headers?.["content-type"] as string | undefined;
    const url: string | undefined = (res as any)?.request?.responseURL;
    const redirectedToKakao =
      !!url && url.includes("/oauth2/authorization/kakao");
    const notJson = !!ct && !ct.includes("application/json");
    const tokenExists = !!localStorage.getItem("accessToken");

    if ((redirectedToKakao || notJson) && !tokenExists) {
      void navigateToAuthGuardOnce(401);
    }
    return res;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const cfg = (error.config ?? {}) as import("axios").AxiosRequestConfig & {
      _retry?: boolean;
    };
    const reqUrl = cfg.url ?? "";

    // 외부 절대 URL은 제외
    const isAbsolute = /^https?:\/\//i.test(reqUrl);
    const reqOrigin = isAbsolute ? getOriginSafely(String(reqUrl)) : API_ORIGIN;
    const isExternalAbsolute = isAbsolute && reqOrigin !== API_ORIGIN;
    if (isExternalAbsolute) return Promise.reject(error);

    // 404 → /404 (기존)
    const isGET = (cfg.method ?? "get").toUpperCase() === "GET";
    const skip404 = cfg.__skipGlobal404 === true;
    const alreadyOn404 =
      router?.state?.location?.pathname === PATH.NOT_FOUND ||
      router?.state?.location?.pathname === "/404";
    const isSSE404 = /\/alert|\/connect|\/events/i.test(String(reqUrl));

    if (
      status === 404 &&
      isGET &&
      !skip404 &&
      !alreadyOn404 &&
      !isSSE404 &&
      !navigating404
    ) {
      navigating404 = true;
      router
        .navigate(PATH.NOT_FOUND, { replace: true })
        .finally(() => setTimeout(() => (navigating404 = false), 300));
      return Promise.reject(error);
    }

    // 401/403 → /auth-required (새 정책)
    const skipAuth = cfg.__skipGlobalAuthGuard === true;
    const isSSEAuth = /\/alert|\/connect|\/events/i.test(String(reqUrl));
    const isRefreshCall = /\/auth\/refresh\b/.test(String(reqUrl));

    // 리프레시 자체가 실패하면 재귀 금지, 즉시 로그아웃 흐름
    if ((status === 401 || status === 403) && isRefreshCall && !skipAuth) {
      localStorage.removeItem("accessToken");
      await navigateToAuthGuardOnce(status as 401 | 403);
      return Promise.reject(error);
    }

    // 401 → 토큰 갱신 시도
    if (status === 401 && !skipAuth && !isSSEAuth) {
      if (cfg._retry) {
        // 이미 재시도했는데 또 401 → 토큰 정리 후 안내화면
        localStorage.removeItem("accessToken");
        await navigateToAuthGuardOnce(401);
        return Promise.reject(error);
      }

      if (!refreshPromise) {
        refreshPromise = startRefresh().finally(() =>
          setTimeout(() => (refreshPromise = null), 100)
        );
      }

      const newToken = await refreshPromise;
      if (newToken) {
        cfg._retry = true;
        cfg.headers = cfg.headers ?? {};
        (cfg.headers as any).Authorization = `Bearer ${newToken}`;
        return api(cfg); // 재시도
      }

      // 리프레시 실패 → 안내화면
      localStorage.removeItem("accessToken");
      await navigateToAuthGuardOnce(401);
      return Promise.reject(error);
    }

    // 403 → 접근권한 없음 화면
    if (status === 403 && !skipAuth && !isSSEAuth) {
      await navigateToAuthGuardOnce(403);
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
if (import.meta.env.DEV) {
  (window as any).__api = api;
  (window as any).__apiBase = COMPUTED_BASE_URL;
  (window as any).__apiOrigin = API_ORIGIN;
}
