import axios, { type AxiosInstance } from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;

const instance: AxiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  (config) => {
    // 요청이 전달되기 전 헤더에 토큰 추가
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
    const refreshToken = localStorage.getItem("refreshToken");

    // 코드가 401이면 토큰 재발급 -> 이 부분 백엔드한테 물어봐야함
    if (error.response.status === 401) {
      try {
        if (refreshToken) {
          const res = await axios.post(
            `${baseURL}/auth/refresh`,
            {},
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );
          if (res.status == 200) {
            const { accessToken, refreshToken } = res.data.data;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            console.log("재발급 완료");
          }

          // 새 토큰으로 헤더 업데이트 후 재요청
          error.config.headers.Authorization = `Bearer ${res.headers.Authorization}`;
          return axios(error.config);
        }
      } catch (refreshErr) {
        console.log("Token 갱신 실패: ", refreshErr);

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
