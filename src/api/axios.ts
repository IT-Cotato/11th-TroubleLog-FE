import axios, { AxiosError } from "axios";
import router from "@/routes/Router";
import { PATH } from "@/constants/paths";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_BASE_URL;
const ENVTYPE = import.meta.env.VITE_ENV_TYPE;

const api = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    EnvType: ENVTYPE,
  },
});

// 요청 인터셉터: 토큰 자동 첨부 (단, /auth/refresh 에는 첨부 X)
api.interceptors.request.use((config) => {
  const url = config.url ?? "";
  const isRefresh = url.includes("/auth/refresh");
  if (!isRefresh) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }

    // EnvType이 없으면 자동 추가 (혹시 덮어쓰는 경우 방지)
    if (!config.headers["EnvType"]) {
      (config.headers as any).EnvType = ENVTYPE;
    }
  }
  return config;
});

let isAuthNavigating = false;

// 리프레시 공용 Promise (동시 401 한 번만 처리)
let refreshPromise: Promise<string | null> | null = null;
const startRefresh = async (): Promise<string | null> => {
  try {
    const r = await api.post("/auth/refresh", {});
    const newToken: string | undefined = r.data?.data?.accessToken;
    if (!newToken) return null;
    localStorage.setItem("accessToken", newToken);
    return newToken;
  } catch {
    return null;
  }
};

api.interceptors.response.use(
  (res) => {
    // 카카오 302가 HTML 200으로 바뀌어 오는 케이스 방어(토큰 없는 상태에서만)
    const ct = res.headers?.["content-type"] as string | undefined;
    const url: string | undefined = res?.request?.responseURL;
    const redirectedToKakao =
      !!url && url.includes("/oauth2/authorization/kakao");
    const notJson = !!ct && !ct.includes("application/json");
    const tokenExists = !!localStorage.getItem("accessToken");

    if (
      (redirectedToKakao || notJson) &&
      !tokenExists &&
      !isAuthNavigating &&
      location.pathname !== PATH.ROOT
    ) {
      isAuthNavigating = true;
      const next = encodeURIComponent(location.pathname + location.search);
      router.navigate(`${PATH.ROOT}?next=${next}`, { replace: true });
      setTimeout(() => (isAuthNavigating = false), 300);
    }
    return res;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const reqUrl = (error.config?.url ?? "") as string;
    const isRefresh = reqUrl.includes("/auth/refresh");
    const onLogin = location.pathname === PATH.ROOT;

    // API 경로 판정(절대/상대 둘 다 커버)
    const isApiPath = reqUrl.startsWith("/") || reqUrl.startsWith("http");
    if (!isApiPath) return Promise.reject(error);

    // 리프레시 요청 자체가 실패(401 등) → 바로 로그아웃 처리
    if (isRefresh) {
      localStorage.removeItem("accessToken");
      if (!onLogin && !isAuthNavigating) {
        isAuthNavigating = true;
        const next = encodeURIComponent(location.pathname + location.search);
        router.navigate(`${PATH.ROOT}?next=${next}`, { replace: true });
        setTimeout(() => (isAuthNavigating = false), 300);
      }
      return Promise.reject(error);
    }

    // 401만 리프레시 시도 (403은 권한 부족 → 바로 로그인으로)
    if (status === 401) {
      // 요청의 무한 재시도 방지 플래그
      const cfg: any = error.config || {};
      if (cfg._retry) {
        // 이미 한 번 재시도했는데도 401이면 토큰 정리 후 로그인 이동
        localStorage.removeItem("accessToken");
        if (!onLogin && !isAuthNavigating) {
          isAuthNavigating = true;
          const next = encodeURIComponent(location.pathname + location.search);
          router.navigate(`${PATH.ROOT}?next=${next}`, { replace: true });
          setTimeout(() => (isAuthNavigating = false), 300);
        }
        return Promise.reject(error);
      }

      // 진행 중 리프레시가 있으면 그걸 기다리고, 없으면 시작
      if (!refreshPromise) {
        refreshPromise = startRefresh().finally(() => {
          // 완료 시 다음 401을 위해 해제
          setTimeout(() => (refreshPromise = null), 0);
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        cfg._retry = true;
        cfg.headers = cfg.headers ?? {};
        cfg.headers.Authorization = `Bearer ${newToken}`;
        return api(cfg); // 동일 인스턴스로 재시도
      }

      // 리프레시 실패 → 토큰 제거 후 로그인 이동
      localStorage.removeItem("accessToken");
      if (!onLogin && !isAuthNavigating) {
        isAuthNavigating = true;
        const next = encodeURIComponent(location.pathname + location.search);
        router.navigate(`${PATH.ROOT}?next=${next}`, { replace: true });
        setTimeout(() => (isAuthNavigating = false), 300);
      }
      return Promise.reject(error);
    }

    if (status === 403) {
      // 권한 없음 → 로그인으로
      if (!onLogin && !isAuthNavigating) {
        isAuthNavigating = true;
        const next = encodeURIComponent(location.pathname + location.search);
        router.navigate(`${PATH.ROOT}?next=${next}`, { replace: true });
        setTimeout(() => (isAuthNavigating = false), 300);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
