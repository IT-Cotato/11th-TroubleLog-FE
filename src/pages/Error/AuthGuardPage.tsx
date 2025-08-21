import { useLocation, useNavigate } from "react-router-dom";
import { PATH } from "@/constants/paths";
import { useViewerId } from "@/store/auth";

export default function AuthGuardPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const viewerId = useViewerId();

  const params = new URLSearchParams(loc.search);
  const status = params.get("status") === "403" ? 403 : 401; // default 401
  const next = params.get("next") || "/";

  const title = status === 403 ? "접근 권한이 없어요" : "로그인이 필요해요";
  const desc =
    status === 403
      ? "이 페이지에 접근할 권한이 없습니다. 권한이 있는 계정으로 다시 시도해 주세요."
      : "요청하신 페이지를 보려면 로그인이 필요합니다.";

  const goBack = () => {
    if (window.history.length > 1) nav(-1);
    else nav(PATH.HOME, { replace: true });
  };

  const goHome = () => nav(PATH.HOME, { replace: true });

  const goLogin = () => {
    const sp = new URLSearchParams();
    sp.set("next", next);
    nav(`${PATH.ROOT}?${sp.toString()}`, { replace: true });
  };

  const goMyPage = () => {
    if (viewerId != null) nav(PATH.MYPAGE(String(viewerId)));
    else goLogin();
  };

  return (
    <section className="w-full flex items-center justify-center py-24 px-6">
      <section className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-10 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100">
            <span className="text-4xl" aria-hidden>
              {status === 403 ? "🚫" : "🔐"}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-head-32-semibold">{title}</h1>
            <p className="text-body-16-regular text-gray-500">{desc}</p>
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
              onClick={goLogin}
              className="px-4 h-11 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              로그인하기
            </button>
            <button
              onClick={goMyPage}
              className="px-4 h-11 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              {viewerId != null ? "내 마이페이지" : "프로필/로그인"}
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
