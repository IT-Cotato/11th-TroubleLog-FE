import { createBrowserRouter } from "react-router-dom";
import Oauth from "@/pages/Login/Oauth";
import SignPageOne from "@/pages/Login/SignPageOne";
import ProtectedRoute from "@/components/Common/ProtectedRouter";
import MainLayout from "@/layouts/MainLayout";
import LoginPage from "@/pages/Login/LoginPage";
import SignPageTwo from "@/pages/Login/SignPageTwo";
import ProjectDetailPage from "@/pages/Project/ProjectDetailPage";
import MyPageLayout from "@/layouts/MyPageLayout";
import MyFollowing from "@/components/MyPage/MyFollowing";
import EditProfile from "@/pages/EditProfile/EditProfile";
import HomePage from "@/pages/Home/HomePage";
import StatisticsPage from "@/pages/MyPage/StatisticsPage";
import LikedPostsPage from "@/pages/MyPage/LikedPostsPage";

import TempWritePage from "@/pages/TempWrite/TempWritePage";

import SearchResultPage from "@/pages/Search/SearchResultPage";
import CommunityPage from "@/pages/Community/CommunityPage";
import TroubleShootingList from "@/components/MyPage/TroubleShootingList";


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
        path: "search",
        children: [
          {
            index: true,
            element: <SearchResultPage />,
          },
        ],
      },
      {
        path: "mypage/:id",
        element: <MyPageLayout />,
        children: [
          {
            index: true,
            element: <TroubleShootingList />,
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
      {
        path: "community",
        element: <CommunityPage />,
      },
    ],
  },
  {
    path: "tempwriting",
    element: (
      <ProtectedRoute>
        <TempWritePage />
      </ProtectedRoute>
    ),
  },
]);

export default router;
