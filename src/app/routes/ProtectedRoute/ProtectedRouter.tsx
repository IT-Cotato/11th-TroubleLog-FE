import { PATH } from "@/shared/config/paths";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

// // 개발 중 인증 우회 여부 설정
// const isDevBypass = true;

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = !!localStorage.getItem("accessToken");
  const loc = useLocation();

  // // 개발 중 우회 허용
  // if (isDevBypass) {
  //   return <>{children}</>;
  // }

  if (!isAuthenticated) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`${PATH.ROOT}?next=${next}`} replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
