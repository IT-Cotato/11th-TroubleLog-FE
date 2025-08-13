import axios from "axios";

const authInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, //
});

// accessToken 자동 첨부
authInstance.interceptors.request.use((config) => {
  if (!config.headers?.Authorization) {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

export default authInstance;
