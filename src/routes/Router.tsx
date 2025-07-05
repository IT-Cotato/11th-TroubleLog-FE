import { createBrowserRouter } from "react-router-dom";
import Home from "@/pages/Home/Home";
import MyPage from "@/pages/MyPage/MyPage";
import Oauth from "@/pages/Login/Oauth";
import SignPageOne from "@/pages/Login/SignPageOne";
import ProtectedRoute from "@/components/Common/ProtectedRouter";
import MainLayout from "@/layouts/MainLayout";
import LoginPage from "@/pages/Login/LoginPage";
import SignPageTwo from "@/pages/Login/SignPageTwo";
import ProjectDetailPage from "@/pages/Project/ProjectDetailPage";

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
    path: "signup/detail",
    element: <SignPageTwo />,
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
      {
        path: "project/:id",
        element: <ProjectDetailPage projectName="Cotato" />,
      },
    ],
  },
]);

export default router;
