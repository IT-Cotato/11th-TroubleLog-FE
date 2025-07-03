import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = !!localStorage.getItem("accessToken");
  return isAuthenticated ? <>{children}</> : <Navigate to="/signup" />;
};

export default ProtectedRoute;
