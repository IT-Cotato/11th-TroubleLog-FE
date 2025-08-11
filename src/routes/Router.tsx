import { createBrowserRouter } from "react-router-dom";
import { PATH } from "@/constants/paths";
import { ROUTE } from "@/constants/routes";
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
import FreeFormWritePage from "@/pages/FreeFormWrite/FreeFormWritePage";
import SearchResultPage from "@/pages/Search/SearchResultPage";
import CommunityPage from "@/pages/Community/CommunityPage";
import TroubleShootingList from "@/components/MyPage/TroubleShootingList";
import CommunityPostDetail from "@/pages/Community/CommunityPostDetail";
import PreviewPage from "@/pages/TempWrite/PreviewPage";

export const router = createBrowserRouter(
  [
    {
      path: PATH.ROOT,
      element: <LoginPage />,
    },
    { path: PATH.OAUTH, element: <Oauth /> },
    {
      path: PATH.SIGNUP,
      element: <SignPageOne />,
    },
    {
      path: PATH.SIGNUP_DETAIL,
      element: <SignPageTwo />,
    },
    {
      path: PATH.USER,
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: PATH.HOME,
          element: <HomePage />,
        },

        {
          path: PATH.SEARCH,
          children: [
            {
              index: true,
              element: <SearchResultPage />,
            },
          ],
        },
        {
          path: ROUTE.MYPAGE,
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
          path: ROUTE.MYPAGE_EDIT,
          element: <EditProfile />,
        },
        {
          path: ROUTE.PROJECT_DETAIL,
          element: <ProjectDetailPage projectName="Cotato" />,
        },
        {
          path: PATH.COMMUNITY,
          element: <CommunityPage />,
        },
        {
          path: ROUTE.COMMUNITY_POST,
          element: <CommunityPostDetail />,
        },
      ],
    },
    {
      path: PATH.TEMP_WRITING,
      element: (
        <ProtectedRoute>
          <TempWritePage />
        </ProtectedRoute>
      ),
    },
    {
      path: PATH.FREEFORM_WRITING,
      element: (
        <ProtectedRoute>
          <FreeFormWritePage />
        </ProtectedRoute>
      ),
    },
  ],
  {

    path: PATH.PREVIEW,
    element: (
      <ProtectedRoute>
        <PreviewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: PATH.FREEFORM_WRITING,
    element: (
      <ProtectedRoute>
        <FreeFormWritePage />
      </ProtectedRoute>
    ),
  },
]);

    basename: import.meta.env.BASE_URL,
  }
);


export default router;
