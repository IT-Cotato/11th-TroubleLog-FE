import { createBrowserRouter } from "react-router-dom";
import Home from "@/pages/Home/Home";
import MyPage from "@/pages/MyPage/MyPage";
import Oauth from "@/pages/Signup/Oauth";
import Signup from "@/pages/Signup/Signup";
import ProtectedRoute from "@/components/Common/ProtectedRouter";
import MainLayout from "@/layouts/MainLayout";
import Login from "@/pages/Signup/Login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  { path: "oauth", element: <Oauth /> },
  {
    path: "signup",
    element: <Signup />,
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
