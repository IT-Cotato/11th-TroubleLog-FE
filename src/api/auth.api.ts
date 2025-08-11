import authInstance from "@/api/authInstance";
import { getAuthHeaders } from "@/api/apiHeaders";
import type {
  RegisterRequest,
  RegisterResponse,
  RefreshResponse,
  LogoutResponse,
  LoginResponse,
  EmailCheckResponse,
} from "@/models/auth.model";

const FIXED = import.meta.env.VITE_FIXED_AUTH;
const ENVTYPE = import.meta.env.VITE_ENV_TYPE;

// 회원가입
export const postRegister = (payload: RegisterRequest) =>
  authInstance.post<RegisterResponse>("/auth/register", payload, {
    headers: getAuthHeaders(),
  });

// 로그인
export const postLogin = (email: string, password: string) =>
  authInstance.post<LoginResponse>(
    "/auth/login",
    { email, password },
    { headers: getAuthHeaders() }
  );

// 이메일 중복 확인
export const postEmailCheck = (email: string) =>
  authInstance.post<EmailCheckResponse>("/auth/email-check", null, {
    params: { email },
    headers: {
      Authorization: `Bearer ${FIXED}`,
      EnvType: ENVTYPE,
    },
  });

// 리프레시 토큰 재발급
export const postRefreshToken = () =>
  authInstance.post<RefreshResponse>("/auth/refresh", {});

// 로그아웃
export const postLogout = () =>
  authInstance.post<LogoutResponse>("/auth/logout", {});
