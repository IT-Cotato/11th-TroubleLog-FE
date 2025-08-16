import axios, { AxiosError } from "axios";
import { router } from "@/routes/Router";
import { PATH } from "@/constants/paths";

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

const api = axios.create({
  baseURL: COMPUTED_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    EnvType: ENVTYPE,
  },
});

// 공통 유틸: 로그인 페이지로의 네비게이션을 1회만
let authNavigationPromise: Promise<void> | null = null;
const getCurrentSpaPath = () => {
  // 라우터가 있으면 라우터 위치를 우선 사용
  const loc: Location | (typeof router)["state"]["location"] =
    (router as any)?.state?.location ?? window.location;
  return `${loc.pathname}${loc.search}${loc.hash}`;
};

const navigateToAuthOnce = (rawNext?: string) => {
  if (!authNavigationPromise) {
    const nextPath = rawNext ?? getCurrentSpaPath(); // 미인코딩 경로
    const params = new URLSearchParams();
    params.set("next", nextPath); // 인코딩은 URLSearchParams가 처리
    router.navigate(`${PATH.ROOT}?${params.toString()}`, { replace: true });
    authNavigationPromise = new Promise<void>((resolve) => {
      // 짧은 쿨다운 후 게이트 해제 (동시 발화 방지)
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
  const isRefresh = url.includes("/auth/refresh");
  config.headers = config.headers ?? {};

  // 외부 절대 URL은 내부 인증/EnvType 헤더 미부착
  const isAbsolute = /^https?:\/\//i.test(url);
  const reqOrigin = isAbsolute ? getOriginSafely(url) : API_ORIGIN;
  const isExternalAbsolute = isAbsolute && reqOrigin !== API_ORIGIN;
  if (isExternalAbsolute) {
    return config;
  }

  // /auth/refresh 에는 Authorization 미첨부
  if (!isRefresh) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
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
    const r = await api.post("/auth/refresh", {});
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
    // 토큰 없이 HTML(카카오 302 후 200) 수신 방어
    const ct = res.headers?.["content-type"] as string | undefined;
    const url: string | undefined = (res as any)?.request?.responseURL;
    const redirectedToKakao =
      !!url && url.includes("/oauth2/authorization/kakao");
    const notJson = !!ct && !ct.includes("application/json");
    const tokenExists = !!localStorage.getItem("accessToken");

    if (
      (redirectedToKakao || notJson) &&
      !tokenExists &&
      location.pathname !== PATH.ROOT
    ) {
      void navigateToAuthOnce(); // 내부에서 안전하게 계산/인코딩
    }
    return res;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const reqUrl = (error.config?.url ?? "") as string;
    const isRefresh = reqUrl.includes("/auth/refresh");
    const onLogin = location.pathname === PATH.ROOT;

    // 외부 절대 URL만 제외 (상대 경로/동일 베이스 URL은 처리)
    const isAbsolute = /^https?:\/\//i.test(reqUrl);
    const reqOrigin = isAbsolute ? getOriginSafely(reqUrl) : API_ORIGIN;
    const isExternalAbsolute = isAbsolute && reqOrigin !== API_ORIGIN;
    if (isExternalAbsolute) return Promise.reject(error);

    // 리프레시 자체 실패 → 즉시 로그인 이동(단 1회)
    if (isRefresh) {
      localStorage.removeItem("accessToken");
      if (!onLogin) {
        await navigateToAuthOnce();
      }
      return Promise.reject(error);
    }

    // 401 → 리프레시(동시성 제어)
    if (status === 401) {
      const cfg: any = error.config || {};
      if (cfg._retry) {
        // 이미 재시도 한 번 했는데도 401 → 토큰 정리 후 이동
        localStorage.removeItem("accessToken");
        if (!onLogin) {
          await navigateToAuthOnce();
        }
        return Promise.reject(error);
      }

      if (!refreshPromise) {
        refreshPromise = startRefresh().finally(() => {
          // 다음 401 대비 해제
          setTimeout(() => (refreshPromise = null), 100);
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        cfg._retry = true;
        cfg.headers = cfg.headers ?? {};
        cfg.headers.Authorization = `Bearer ${newToken}`;
        return api(cfg); // 동일 인스턴스로 재시도
      }

      // 리프레시 실패
      localStorage.removeItem("accessToken");
      if (!onLogin) {
        await navigateToAuthOnce();
      }
      return Promise.reject(error);
    }

    // 403 → 권한 부족: 로그인 이동(단 1회)
    if (status === 403 && !onLogin) {
      await navigateToAuthOnce();
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
