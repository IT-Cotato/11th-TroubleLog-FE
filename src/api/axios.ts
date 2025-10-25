import axios, { AxiosError } from "axios";
import { router } from "@/app/routes/router";
import { PATH } from "@/shared/config/paths";
import { isAuthCallbackPath } from "@/shared/lib/auth-route";
import { getOriginSafely, isAbsoluteUrl } from "@/shared/lib/url";

// ----- BASE URL / ORIGIN -----
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
  /\/+$/,
  ""
);
const ENVTYPE = import.meta.env.VITE_ENV_TYPE;

const API_ORIGIN = getOriginSafely(API_BASE_URL);

// axios 타입 확장: 요청 단위로 전역 가드를 스킵
declare module "axios" {
  export interface AxiosRequestConfig {
    __skipGlobal404?: boolean;
    __skipGlobalAuthGuard?: boolean;
    __anonymous?: boolean;
    _retry?: boolean;
  }
}

// 전역 리프레시 중복 요청 방지
declare global {
  interface Window {
    __authRefreshPromise?: Promise<string | null> | null;
  }
}
const getRefreshPromise = () => window.__authRefreshPromise ?? null;
const setRefreshPromise = (p: Promise<string | null> | null) =>
  (window.__authRefreshPromise = p);

const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    EnvType: ENVTYPE,
  },
});

// ----- 공통 유틸 -----
let navigating404 = false;
let authNavigationPromise: Promise<void> | null = null;

const getCurrentSpaPath = () => {
  const loc: Location | (typeof router)["state"]["location"] =
    (router as any)?.state?.location ?? window.location;
  return `${loc.pathname}${loc.search}${loc.hash}`;
};

// 401/403 안내화면 이동 (콜백 경로에서는 동작 금지)
const navigateToAuthGuardOnce = (status: 401 | 403, rawNext?: string) => {
  if (isAuthCallbackPath(window.location.pathname)) return Promise.resolve();
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

const REFRESH_OK_KEY = "auth:lastRefreshOkAt";
const setRecentRefreshOk = () => {
  try {
    localStorage.setItem(REFRESH_OK_KEY, String(Date.now()));
  } catch {
    //
  }
};
const hasRecentRefreshOk = (ms = 10_000) => {
  try {
    const raw =
      localStorage.getItem(REFRESH_OK_KEY) ??
      sessionStorage.getItem(REFRESH_OK_KEY);
    const ts = raw ? Number(raw) : NaN;
    return Number.isFinite(ts) && Date.now() - ts < ms;
  } catch {
    return false;
  }
};

// ----- 요청 인터셉터: 토큰/헤더 부착, 외부 절대 URL은 스킵 -----
const reqId = api.interceptors.request.use((config) => {
  const url = config.url ?? "";
  config.headers = config.headers ?? {};

  // 1) 익명 요청 우선 적용 (외부 URL 포함)
  if (config.__anonymous) {
    // 토큰 금지
    delete (config.headers as any).Authorization;
    // 쿠키 금지 (CSRF 회피용)
    config.withCredentials = false;
    // EnvType 유지
    if ((config.headers as any).EnvType == null)
      (config.headers as any).EnvType = ENVTYPE;
    return config;
  }

  // 2) 외부 절대 URL → 토큰/쿠키 금지
  const isAbsolute = isAbsoluteUrl(url);
  const reqOrigin = isAbsolute ? getOriginSafely(url) : API_ORIGIN;
  const isExternalAbsolute = isAbsolute && reqOrigin !== API_ORIGIN;
  if (isExternalAbsolute) {
    delete (config.headers as any).Authorization;
    config.withCredentials = false;
    return config;
  }

  const token = localStorage.getItem("accessToken");
  if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  if ((config.headers as any).EnvType == null)
    (config.headers as any).EnvType = ENVTYPE;

  return config;
});

// ----- 리프레시: POST /auth/refresh, 전역 가드/404 스킵 -----
export const startRefresh = async (): Promise<string | null> => {
  try {
    const r = await api.post("/auth/refresh", undefined, {
      __skipGlobalAuthGuard: true,
      __skipGlobal404: true,
    });
    // 서버 응답 케이스 모두 대응:
    //  - { success:true, data:"<token>" }   ← 현재 스키마
    //  - { data:{ accessToken:"<token>" } }
    //  - { accessToken:"<token>" }
    const body = r?.data;
    const newToken: string | null =
      (typeof body?.data === "string" && body.data) ||
      body?.data?.accessToken ||
      body?.accessToken ||
      null;
    if (!newToken) {
      console.error("[Auth] Refresh: token not found in response:", body);
      return null;
    }
    localStorage.setItem("accessToken", newToken);

    setRecentRefreshOk(); // 갱신 성공 신호
    return newToken;
  } catch {
    return null;
  }
};

// ----- 응답 인터셉터 -----
const resId = api.interceptors.response.use(
  (res) => {
    // 콜백 라우트에서는 어떤 전역 네비도 하지 않음
    if (isAuthCallbackPath(window.location.pathname)) return res;

    // (안전망) 토큰 없이 HTML/리디렉트 비JSON 응답이면 로그인 요구
    const ct = res.headers?.["content-type"] as string | undefined;
    const url: string = (res as any)?.request?.responseURL || "";

    // 서버가 302 → /login으로 돌린 뒤 브라우저가 따라가서 받은 HTML 응답
    //    => 이 경우는 "인증 상실"로 보고 401 에러처럼 처리(에러 핸들러로 보냄)
    const isLoginFollowed =
      /\/login(\?|$)/.test(url) && (!ct || /text\/html/i.test(ct));

    if (isLoginFollowed) {
      const err = new AxiosError(
        "Redirected to login",
        "ERR_UNAUTHORIZED",
        res.config,
        (res as any).request,
        {
          status: 401,
          statusText: "Unauthorized",
          headers: res.headers,
          config: res.config,
          data: res.data,
        } as any
      );
      return Promise.reject(err);
    }

    const redirectedToKakao =
      !!url && url.includes("/oauth2/authorization/kakao");
    const notJson = !!ct && !ct.includes("application/json");
    const tokenExists = !!localStorage.getItem("accessToken");
    if ((redirectedToKakao || notJson) && !tokenExists)
      void navigateToAuthGuardOnce(401);

    return res;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const cfg = (error.config ?? {}) as import("axios").AxiosRequestConfig & {
      _retry?: boolean;
      __skipGlobalAuthGuard?: boolean;
      __skipGlobal404?: boolean;
    };
    const reqUrl = cfg.url ?? "";

    // 외부 절대 URL 에러는 간섭하지 않음
    const isAbsolute = /^https?:\/\//i.test(reqUrl);
    const reqOrigin = isAbsolute ? getOriginSafely(String(reqUrl)) : API_ORIGIN;
    const isExternalAbsolute = isAbsolute && reqOrigin !== API_ORIGIN;
    if (isExternalAbsolute) return Promise.reject(error);

    // 콜백 라우트에서는 전역 404/401/403/리프레시 모두 스킵
    if (isAuthCallbackPath(window.location.pathname))
      return Promise.reject(error);

    // 404 → /404 (SSE/특수요청 제외)
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

    // 401/403 → 전역 가드 (특정 요청 스킵 가능)
    const skipAuth =
      cfg.__skipGlobalAuthGuard === true || cfg.__anonymous === true;
    const isSSEAuth = /\/alert|\/connect|\/events/i.test(String(reqUrl));
    const isRefreshCall = /\/auth\/refresh\b/.test(String(reqUrl));

    // 리프레시 자체 실패 → 토큰 제거 후 안내화면 (콜백 경로면 위에서 리턴됨)
    if ((status === 401 || status === 403) && isRefreshCall && !skipAuth) {
      localStorage.removeItem("accessToken");
      await navigateToAuthGuardOnce(status as 401 | 403);
      return Promise.reject(error);
    }

    // 토큰 전무 상태의 401은 refresh/가드 네비 금지 (그냥 실패로 반환)
    const storedToken = localStorage.getItem("accessToken") || "";
    const hasBearer = !!(cfg.headers && (cfg.headers as any).Authorization);

    if (
      status === 401 &&
      !skipAuth &&
      !isSSEAuth &&
      !storedToken &&
      !hasBearer
    ) {
      return Promise.reject(error);
    }

    // 401 → "무조건" 리프레시 먼저 시도, 성공 시 원요청 1회 재시도
    if (status === 401 && !skipAuth && !isSSEAuth) {
      let p = getRefreshPromise();
      if (!p) {
        p = startRefresh().finally(() =>
          setTimeout(() => setRefreshPromise(null), 100)
        );
        setRefreshPromise(p);
      }
      const newToken = await p;

      if (newToken) {
        if (!cfg._retry) {
          cfg._retry = true;
          cfg.headers = cfg.headers ?? {};
          (cfg.headers as any).Authorization = `Bearer ${newToken}`;
          return api(cfg); // 재시도
        }
      }

      localStorage.removeItem("accessToken");
      await navigateToAuthGuardOnce(401);
      return Promise.reject(error);
    }

    // 403 → 접근권한 없음 화면
    if (status === 403 && !skipAuth && !isSSEAuth) {
      // 1) 리프레시 진행 중이면 완료까지 대기 후 재시도
      const inflight = getRefreshPromise();
      if (inflight && !cfg._retry) {
        const t = await inflight;
        if (t) {
          cfg._retry = true;
          cfg.headers = cfg.headers ?? {};
          (cfg.headers as any).Authorization = `Bearer ${t}`;
          return api(cfg);
        }
      }

      // 2) 직전에 갱신 성공한 토큰이 있으면 1회 재시도 (선택적)
      const latestToken = localStorage.getItem("accessToken");
      if (hasRecentRefreshOk() && latestToken && !cfg._retry) {
        cfg._retry = true;
        cfg.headers = cfg.headers ?? {};
        (cfg.headers as any).Authorization = `Bearer ${latestToken}`;
        return api(cfg);
      }

      // 3) 실패 → 접근 권한 없음 화면
      await navigateToAuthGuardOnce(403);
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// HMR 정리
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    api.interceptors.request.eject(reqId);
    api.interceptors.response.eject(resId);
  });
}

export default api;

// 디버그 도우미
if (import.meta.env.DEV) {
  (window as any).__api = api;
  (window as any).__apiBase = API_BASE_URL;
  (window as any).__apiOrigin = API_ORIGIN;
  (window as any).__forceRefresh = async () => {
    console.groupCollapsed("[DEBUG] __forceRefresh()");
    const t = await startRefresh();
    console.log(
      "startRefresh() returned:",
      t ? `${t.slice(0, 8)}…(${t.length})` : t
    );
    console.log(
      "localStorage.accessToken now:",
      localStorage.getItem("accessToken")
    );
    console.groupEnd();
    return t;
  };
}
