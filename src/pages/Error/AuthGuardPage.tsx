import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATH } from "@/shared/config/paths";
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
    if (viewerId != null) nav(PATH.MYPAGE_BASE);
    else goLogin();
  };

  // ---- NEW: 토큰 갱신 성공 감지 → 자동 복귀 ----
  const bouncedRef = useRef(false);
  const RECENT_MS = 10_000; // 최근 10초 이내 갱신 성공만 유효

  const hasRecentRefreshOk = () => {
    try {
      const raw =
        localStorage.getItem("auth:lastRefreshOkAt") ??
        sessionStorage.getItem("auth:lastRefreshOkAt");
      const ts = raw ? Number(raw) : NaN;
      return Number.isFinite(ts) && Date.now() - ts < RECENT_MS;
    } catch {
      return false;
    }
  };

  // 1) 마운트/상태 변경 시 즉시 판단
  useEffect(() => {
    if (bouncedRef.current) return;

    const recent = hasRecentRefreshOk();

    // 401: viewerId가 생기거나 최근 갱신 신호가 있으면 복귀
    // 403: 최근 갱신 신호가 "있을 때만" 복귀 (권한 이슈 루프 방지)
    const shouldBounce =
      (status === 401 && (viewerId != null || recent)) ||
      (status === 403 && recent);

    if (shouldBounce) {
      bouncedRef.current = true;
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerId, status]);

  // 2) 갱신이 "뒤늦게" 성공하는 경우를 위해 짧게 폴링
  useEffect(() => {
    if (bouncedRef.current) return;

    let elapsed = 0;
    const interval = window.setInterval(() => {
      if (bouncedRef.current) return;
      if (hasRecentRefreshOk()) {
        bouncedRef.current = true;
        goBack();
      }
      elapsed += 500;
      if (elapsed >= RECENT_MS) {
        window.clearInterval(interval);
      }
    }, 500);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
