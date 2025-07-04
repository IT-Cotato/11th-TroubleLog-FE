import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

// 개발 중 인증 우회 여부 설정
const isDevBypass = true;

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = !!localStorage.getItem("accessToken");

  // 개발 중 우회 허용
  if (isDevBypass) {
    return <>{children}</>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/signup" />;
};

export default ProtectedRoute;
