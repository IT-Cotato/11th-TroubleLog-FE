import axios, { type AxiosInstance } from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_BASE_URL;

const instance: AxiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    // 요청이 전달되기 전 헤더에 accessToken 추가
    config.headers = config.headers ?? {};
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // accessToken 만료로 인한 401 응답 시 처리
    if (error.response?.status === 401) {
      try {
        const res = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true, // refreshToken 쿠키 포함
          }
        );

        if (res.status === 200) {
          const { accessToken } = res.data.data;
          localStorage.setItem("accessToken", accessToken);

          // 실패했던 요청에 새 accessToken 적용
          error.config.headers = error.config.headers ?? {};
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return axios(error.config);
        }
      } catch (refreshErr) {
        console.error("Token 갱신 실패:", refreshErr);
        localStorage.removeItem("accessToken");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
