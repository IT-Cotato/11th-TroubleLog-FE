import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { PATH } from "@/shared/config/paths";

// 레이지 import (코드 스플리팅)
const MainLayout = lazy(() => import("@/layouts/MainLayout"));
const MyPageLayout = lazy(() => import("@/layouts/MyPageLayout"));
const ProtectedRoute = lazy(
  () => import("@/app/routes/ProtectedRoute/ProtectedRouter")
);

const IntroLandingPage = lazy(
  () => import("@/pages/Onboarding/IntroLandingPage")
);
const LoginPage = lazy(() => import("@/pages/Login/LoginPage"));
const SignPageOne = lazy(() => import("@/pages/Login/SignPageOne"));
const SignPageTwo = lazy(() => import("@/pages/Login/SignPageTwo"));
const SignPageOauth = lazy(() => import("@/pages/Login/SignPageOauth"));
const OAuthPopupKakao = lazy(() => import("@/pages/Login/OAuthPopupKakao"));

const HomePage = lazy(() => import("@/pages/Home/HomePage"));
const SearchResultPage = lazy(() => import("@/pages/Search/SearchResultPage"));

const ProjectDetailPage = lazy(
  () => import("@/pages/Project/ProjectDetailPage")
);

const CommunityPage = lazy(() => import("@/pages/Community/CommunityPage"));
const CommunityPostDetail = lazy(
  () => import("@/pages/Community/CommunityPostDetail")
);

const CombinedDetailPage = lazy(
  () => import("@/pages/MyPage/CombinedDetailPage")
);
const StatisticsPage = lazy(() => import("@/pages/MyPage/StatisticsPage"));
const LikedPostsPage = lazy(() => import("@/pages/MyPage/LikedPostsPage"));
const EditProfile = lazy(() => import("@/pages/EditProfile/EditProfile"));
const TroubleShootingList = lazy(
  () => import("@/widgets/mypage/TroubleShootingList")
);
const MyFollowing = lazy(() => import("@/widgets/mypage/MyFollowing"));

const TempWritePage = lazy(() => import("@/pages/TempWrite/TempWritePage"));
const FreeFormWritePage = lazy(
  () => import("@/pages/FreeFormWrite/FreeFormWritePage")
);
const PreviewPage = lazy(() => import("@/pages/TempWrite/PreviewPage"));
const PostSummaryDetail = lazy(
  () => import("@/pages/TempWrite/PostSummaryDetail")
);

const NotFoundPage = lazy(() => import("@/pages/Error/NotFoundPage"));
const AuthGuardPage = lazy(() => import("@/pages/Error/AuthGuardPage"));

export const router = createBrowserRouter(
  [
    { path: PATH.LANDING, element: <IntroLandingPage /> },

    // 로그인/회원가입
    { path: PATH.ROOT, element: <LoginPage /> },
    { path: PATH.LOGIN, element: <LoginPage /> },
    { path: PATH.SIGNUP, element: <SignPageOne /> },
    { path: PATH.SIGNUP_DETAIL, element: <SignPageTwo /> },
    { path: PATH.SIGNUP_OAUTH, element: <SignPageOauth /> },

    // 콜백 브릿지
    { path: PATH.OAUTH_REGISTER, element: <OAuthPopupKakao /> },

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
          path: PATH.MYPAGE(":id"),
          element: <MyPageLayout />,
          children: [
            { index: true, element: <TroubleShootingList /> },
            { path: "following", element: <MyFollowing /> },
            { path: "follower", element: <MyFollowing /> },
            { path: "statistics", element: <StatisticsPage /> },
            { path: "likes", element: <LikedPostsPage /> },
          ],
        },
        { path: PATH.MYPAGE_EDIT(":id"), element: <EditProfile /> },

        // 프로젝트 상세
        { path: PATH.PROJECT_DETAIL(":id"), element: <ProjectDetailPage /> },

        // 커뮤니티
        { path: PATH.COMMUNITY, element: <CommunityPage /> },
        {
          path: PATH.COMMUNITY_POST(":postId"),
          element: <CommunityPostDetail />,
        },
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
      path: PATH.PREVIEW_ROUTE,
      element: (
        <ProtectedRoute>
          <PreviewPage />
        </ProtectedRoute>
      ),
    },

    // 에러 페이지
    { path: PATH.AUTH_GUARD, element: <AuthGuardPage /> },
    { path: PATH.NOT_FOUND, element: <NotFoundPage /> },
    {
      path: PATH.POST_SUMMARY_ROUTE,
      element: (
        <ProtectedRoute>
          <PostSummaryDetail />
        </ProtectedRoute>
      ),
    },
    { path: PATH.COMBINED_DETAIL(), element: <CombinedDetailPage /> },

    // fallback
    { path: "*", element: <NotFoundPage /> },
  ],
  { basename: "/" }
);

export default router;
