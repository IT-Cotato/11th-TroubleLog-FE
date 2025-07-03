import { createBrowserRouter } from "react-router-dom";
import Home from "@/pages/Home/Home";
import MyPage from "@/pages/MyPage/MyPage";
import Oauth from "@/pages/Login/Oauth";
import SignPageOne from "@/pages/Login/SignPageOne";
import ProtectedRoute from "@/components/Common/ProtectedRouter";
import MainLayout from "@/layouts/MainLayout";
import LoginPage from "@/pages/Login/LoginPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  { path: "oauth", element: <Oauth /> },
  {
    path: "signup",
    element: <SignPageOne />,
  },
  {
    path: "user",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "home",
        element: <Home />,
      },
      { path: "mypage", element: <MyPage /> },
    ],
  },
]);

export default router;
