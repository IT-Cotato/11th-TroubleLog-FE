import { Outlet } from "react-router-dom";
import { SummaryCompletionSnackbar } from "@/widgets/summary/SummaryCompletionSnackbar";

/**
 * 라우터 트리 전역: 요약 완료 스낵바(하단) — Router 컨텍스트 안에서 useNavigate 사용
 */
export default function RootLayout() {
  return (
    <>
      <SummaryCompletionSnackbar />
      <Outlet />
    </>
  );
}
