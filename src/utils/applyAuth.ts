import axios from "axios";

export function applyAuth(accessToken?: string) {
  const envType = import.meta.env.VITE_ENV_TYPE || "dev"; // 너희 서버 요구값

  // 공통 EnvType 헤더
  axios.defaults.headers.common["EnvType"] = envType;

  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  }
}
