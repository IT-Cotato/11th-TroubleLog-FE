import { applyAuth } from "@/utils/applyAuth";
import { useAuthStore } from "@/store/auth";
import { PATH } from "@/shared/config/paths";
import { router } from "@/app/routes/router";

export function handleLoginSuccess(options: {
  userId: number;
  accessToken: string;
  /** 로그인 후 이동할 경로 (기본: HOME) */
  redirectTo?: string;
}) {
  const { userId, accessToken, redirectTo = PATH.HOME } = options;

  // 1) axios 기본 헤더 + localStorage.accessToken 설정
  applyAuth(accessToken);

  // 2) 전역 유저 상태 저장
  const { setUser } = useAuthStore.getState();
  setUser({ userId });

  // 3) 필요하다면 다른 토큰/임시 값 정리 (기존 refreshToken localStorage 등)
  try {
    // 예: 과거에 refreshToken을 localStorage에 저장해둔 적이 있다면
    localStorage.removeItem("refreshToken");
  } catch {
    //
  }

  // 4) 라우팅
  router.navigate(redirectTo, { replace: true });
}
