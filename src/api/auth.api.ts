import getAPIResponseData from "@/utils/getAPIResponseData";
import { getAuthHeaders } from "@/api/apiHeaders";
import {
  type RegisterRequest,
  type RegisterResponse,
  type RefreshResponse,
  type LogoutResponse,
  type LoginResponse,
  type EmailCheckResponse,
  type OauthRegisterRequest,
  type TermsLatestResponse,
  type OauthRegisterResponse,
  type FindPasswordRequest,
  type FindPasswordResponse,
  type CheckCodeRequest,
  type ChangePasswordRequest,
} from "@/models/auth.model";

// 회원가입
export const postRegister = (payload: RegisterRequest) =>
  getAPIResponseData<RegisterResponse, RegisterRequest>({
    url: "/auth/register",
    method: "POST",
    data: payload,
    headers: getAuthHeaders(),
  });

// 최신 약관 조회
export const getLatestTerms = () =>
  getAPIResponseData<TermsLatestResponse>({
    url: "/terms/latest",
    method: "GET",
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

// 카카오 로그인 후 입력란
export const postOauthRegister = (payload: OauthRegisterRequest) =>
  getAPIResponseData<OauthRegisterResponse, OauthRegisterRequest>({
    url: "/auth/oauth-register",
    method: "POST",
    data: payload,
    headers: getAuthHeaders(),
  });

export const postLogout = () => {
  const access = localStorage.getItem("accessToken") ?? "";
  const refresh = localStorage.getItem("refreshToken") ?? "";

  return getAPIResponseData<LogoutResponse | null, { refreshToken?: string }>({
    url: "/auth/logout",
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
    data: refresh ? { refreshToken: refresh } : undefined,
  });
};

// 비밀번호 찾기 이메일 인증
export const postFindPassword = (payload: FindPasswordRequest) =>
  getAPIResponseData<FindPasswordResponse, FindPasswordRequest>({
    url: "/auth/find-password",
    method: "POST",
    data: payload,
    headers: getAuthHeaders(),
  });

// 비밀번호 찾기 인증번호 검증
export const postCheckCode = (payload: CheckCodeRequest) =>
  getAPIResponseData<string, CheckCodeRequest>({
    url: "/auth/check-code",
    method: "POST",
    data: payload,
    headers: getAuthHeaders(),
  });

// 비밀번호 재설정
export const postChangePassword = (payload: ChangePasswordRequest) =>
  getAPIResponseData<string, ChangePasswordRequest>({
    url: "/auth/change-password",
    method: "POST",
    data: payload,
    headers: getAuthHeaders(),
  });
