import getAPIResponseData from "@/utils/getAPIResponseData";
import { getAuthHeaders } from "@/api/apiHeaders";
import type {
  RegisterRequest,
  RegisterResponse,
  RefreshResponse,
  LogoutResponse,
  LoginResponse,
  EmailCheckResponse,
} from "@/models/auth.model";

// 회원가입
export const postRegister = (payload: RegisterRequest) =>
  getAPIResponseData<RegisterResponse, RegisterRequest>({
    url: "/auth/register",
    method: "POST",
    data: payload,
    headers: getAuthHeaders(),
  });

// 로그인
export const postLogin = (email: string, password: string) =>
  getAPIResponseData<LoginResponse, { email: string; password: string }>({
    url: "/auth/login",
    method: "POST",
    data: { email, password },
    headers: getAuthHeaders(),
  });

// 이메일 중복 확인
export const postEmailCheck = (email: string) =>
  getAPIResponseData<EmailCheckResponse>({
    url: "/auth/email-check",
    method: "POST",
    params: { email },
    headers: getAuthHeaders(),
  });

// 리프레시 토큰 재발급 (필요 시 수동 호출용; 인터셉터에서도 처리됨)
export const postRefreshToken = () =>
  getAPIResponseData<RefreshResponse>({
    url: "/auth/refresh",
    method: "POST",
  });

// 로그아웃 (서버가 204면 getAPIResponseData가 null 반환)
export const postLogout = () =>
  getAPIResponseData<LogoutResponse | null>({
    url: "/auth/logout",
    method: "POST",
  });
