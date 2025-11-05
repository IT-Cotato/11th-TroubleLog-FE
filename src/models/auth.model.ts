// 공통 에러 필드
export interface FieldError {
  field: string;
  message: string;
}

export interface ErrorInfo {
  status: string;
  message: string;
  method: string;
  requestURI: string;
  errors: FieldError[];
}

// 회원가입
export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
  field: string;
  bio: string;
  githubUrl?: string;
  termsAgreements: termsAgreements;
}

interface termsAgreements {
  "1": boolean;
  "2": boolean;
}

export interface RegisterResponse {
  status: number;
}

// 약관
export type TermsType = "TERMS_OF_SERVICE" | "PRIVACY_POLICY" | string;

export interface TermsDto {
  id: number;
  termsType: TermsType;
  title: string;
  body: string;
  isRequired: boolean;
  expirationPeriod: number;
}

export interface TermsLatestResponse {
  termsDtoList: TermsDto[];
}

// 엑세스 토큰 재발급
export interface RefreshResponse {
  accessToken: string;
}

// 로그아웃
export interface LogoutResponse {
  success: boolean;
  data: string;
  error: ErrorInfo;
  timestamp: string;
}

// 로그인
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  accessToken: string;
  refreshToken: string;
  localToken: string;
}

// 이메일 중복
export interface EmailCheckRequest {
  email: string;
}

export interface EmailCheckResponse {
  success: boolean;
  data: string;
  error: ErrorInfo;
  timestamp: string;
}

export interface OauthRegisterRequest {
  userId: number;
  nickname: string;
  field: string;
  bio: string;
  githubUrl?: string;
}
