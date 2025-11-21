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
  type KakaoIntegrationRequest,
} from "@/models/auth.model";
import api from "./axios";

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
export async function postOauthRegister(
  payload: OauthRegisterRequest
): Promise<OauthRegisterResponse> {
  const res = await api.post("/auth/oauth-register", payload);

  // 1) body 에서 userId만 꺼내기
  const userId: number | undefined = res.data?.data?.userId;

  // 2) 필요하면 헤더에서 accessToken 꺼내기
  const accessToken =
    res.headers["accesstoken"] ?? res.headers["authorization"];

  return {
    userId: userId!,
    accessToken,
  };
}

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

// 카카오 통합 연동 API
export const postKakaoIntegration = (payload: KakaoIntegrationRequest) =>
  getAPIResponseData<string, KakaoIntegrationRequest>({
    url: "/auth/integration/kakao",
    method: "POST",
    data: payload,
    headers: getAuthHeaders(),
  });
