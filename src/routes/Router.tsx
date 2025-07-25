import { createBrowserRouter } from "react-router-dom";
import Oauth from "@/pages/Login/Oauth";
import SignPageOne from "@/pages/Login/SignPageOne";
import ProtectedRoute from "@/components/Common/ProtectedRouter";
import MainLayout from "@/layouts/MainLayout";
import LoginPage from "@/pages/Login/LoginPage";
import SignPageTwo from "@/pages/Login/SignPageTwo";
import ProjectDetailPage from "@/pages/Project/ProjectDetailPage";
import MyPageLayout from "@/layouts/MyPageLayout";
import MyTroubleShooting from "@/components/MyPage/MyTroubleShooting";
import MyFollowing from "@/components/MyPage/MyFollowing";
import EditProfile from "@/pages/EditProfile/EditProfile";
import HomePage from "@/pages/Home/HomePage";
import StatisticsPage from "@/pages/MyPage/StatisticsPage";
import LikedPostsPage from "@/pages/MyPage/LikedPostsPage";
import TempWritePage from "@/pages/TempWrite/TempWritePage";

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
        element: <HomePage />,
      },
      {
        path: "mypage/:id",
        element: <MyPageLayout />,
        children: [
          {
            index: true,
            element: <MyTroubleShooting />,
          },
          {
            path: "following",
            element: <MyFollowing />,
          },
          {
            path: "follower",
            element: <MyFollowing />,
          },
          {
            path: "statistics",
            element: <StatisticsPage />,
          },
          {
            path: "likes",
            element: <LikedPostsPage />,
          },
        ],
      },
      {
        path: "mypage/:id/editprofile",
        element: <EditProfile />,
      },
      {
        path: "project/:id",
        element: <ProjectDetailPage projectName="Cotato" />,
      },
    ],
  },
  {
    path: "tempwriting",
    element: <TempWritePage />,
  },
]);

export default router;
