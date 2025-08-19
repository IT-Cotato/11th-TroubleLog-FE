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
import PostSummaryDetail from "@/pages/TempWrite/PostSummaryDetail";
import PreviewPage from "@/pages/TempWrite/PreviewPage";
import NotFoundPage from "@/pages/Error/NotFoundPage";
import AuthGuardPage from "@/pages/Error/AuthGuardPage";
import SignPageOauth from "@/pages/Login/SignPageOauth";
import CombinedDetailPage from "@/pages/MyPage/CombinedDetailPage";
export const router = createBrowserRouter(
  [
    // 로그인/회원가입
    { path: PATH.ROOT, element: <LoginPage /> },
    { path: PATH.OAUTH, element: <Oauth /> },
    { path: PATH.SIGNUP, element: <SignPageOne /> },
    { path: PATH.SIGNUP_DETAIL, element: <SignPageTwo /> },
    { path: PATH.SIGNUP_OAUTH, element: <SignPageOauth /> },

    // 보호 구역 (메인 레이아웃)
    {
      path: PATH.USER,
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: PATH.HOME, element: <HomePage /> },

        // 검색
        { path: PATH.SEARCH, element: <SearchResultPage /> },

        // 마이페이지
        {
          path: ROUTE.MYPAGE,
          element: <MyPageLayout />,
          children: [
            { index: true, element: <TroubleShootingList /> },
            { path: "following", element: <MyFollowing /> },
            { path: "follower", element: <MyFollowing /> },
            { path: "statistics", element: <StatisticsPage /> },
            { path: "likes", element: <LikedPostsPage /> },
          ],
        },
        { path: ROUTE.MYPAGE_EDIT, element: <EditProfile /> },

        // 프로젝트 상세
        {
          path: ROUTE.PROJECT_DETAIL,
          element: <ProjectDetailPage />,
        },

        // 커뮤니티
        { path: PATH.COMMUNITY, element: <CommunityPage /> },
        { path: ROUTE.COMMUNITY_POST, element: <CommunityPostDetail /> },
      ],
    },

    // 작성/미리보기 (보호 라우트)
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
    {
      path: PATH.PREVIEW_ROUTE, // "/troubles/:postId"
      element: (
        <ProtectedRoute>
          <PreviewPage />
        </ProtectedRoute>
      ),
    },
    // 에러 페이지
    { path: PATH.AUTH_GUARD, element: <AuthGuardPage /> },
    {
      path: PATH.NOT_FOUND,
      element: <NotFoundPage />,
    },
    {
      path: "*",
      element: <NotFoundPage />,
    },
    {
      path: PATH.POST_SUMMARY_ROUTE,
      element: (
        <ProtectedRoute>
          <PostSummaryDetail />
        </ProtectedRoute>
      ),
    },
    {
      path: PATH.COMBINED_DETAIL(),
      element: <CombinedDetailPage />,
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);

export default router;
