import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATH } from "@/constants/paths";
import { useViewerId } from "@/store/auth";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const viewerId = useViewerId();

  const missingPath = useMemo(() => {
    const full = location.pathname + (location.search || "");
    return full.length > 80 ? full.slice(0, 77) + "..." : full;
  }, [location.pathname, location.search]);

  const goBack = () => {
    // 히스토리가 거의 없는 진입(새로고침/딥링크) 대비
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(PATH.HOME, { replace: true });
    }
  };

  const goHome = () => navigate(PATH.HOME, { replace: true });

  const goMyPage = () => {
    if (viewerId != null) {
      navigate(PATH.MYPAGE(String(viewerId)));
    } else {
      navigate(PATH.ROOT);
    }
  };

  const goSearch = () => {
    const sp = new URLSearchParams();
    sp.set("query", "");
    sp.set("scope", "community");
    sp.set("page", "1");
    sp.set("size", "10");
    navigate(`${PATH.SEARCH}?${sp.toString()}`);
  };

  return (
    <main className="w-full flex items-center justify-center py-24 px-6">
      <section className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-10 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100">
            <span className="text-4xl" aria-hidden>
              🧭
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-head-32-semibold">페이지를 찾을 수 없어요</h1>
            <p className="text-body-16-regular text-gray-500">
              요청하신 주소가 변경되었거나 삭제되었을 수 있어요.
            </p>
            <p className="text-body-14-regular text-gray-400">
              <span className="mr-1">요청 경로:</span>
              <code className="rounded bg-gray-50 px-2 py-1 text-gray-600">
                {missingPath || "/"}
              </code>
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={goBack}
              className="px-4 h-11 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              이전 페이지
            </button>
            <button
              onClick={goHome}
              className="px-4 h-11 rounded-lg bg-primary text-white hover:opacity-90 transition"
            >
              홈으로 가기
            </button>
            <button
              onClick={goSearch}
              className="px-4 h-11 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              검색으로 찾아보기
            </button>
            <button
              onClick={goMyPage}
              className="px-4 h-11 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              {viewerId != null ? "내 마이페이지" : "로그인/프로필"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
