import getAPIResponseData from "@/utils/getAPIResponseData";
import { getAuthHeaders } from "@/api/apiHeaders";
import type {
  RegisterRequest,
  RegisterResponse,
  RefreshResponse,
  LogoutResponse,
  LoginResponse,
  EmailCheckResponse,
  OauthRegisterRequest,
  TermsLatestResponse,
  OauthRegisterResponse,
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
