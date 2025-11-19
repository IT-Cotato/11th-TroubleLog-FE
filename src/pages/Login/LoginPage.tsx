import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "./Input";
import onboarding_image from "../../assets/images/onboarding_image.png";
import KakaoLoginButton from "./KakaoLoginButton";
import { postLogin } from "@/api/auth.api";
import { PATH } from "@/shared/config/paths";
import { useAuthStore } from "@/store/auth";
import { applyAuth } from "@/utils/applyAuth";
import { handleLoginSuccess } from "@/utils/handleLoginSuccess";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 진입 시 ?next= 처리
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const next = sp.get("next");

    if (next) {
      try {
        // '/user/home?...' 또는 절대경로일 수 있으니 현재 오리진을 베이스로
        const u = new URL(decodeURIComponent(next), window.location.origin);

        // 보안: 다른 오리진은 무시
        if (u.origin !== window.location.origin) {
          console.debug("[LoginPage] next origin mismatch:", u.origin);
        } else {
          const accessToken = u.searchParams.get("accessToken");
          const userIdStr = u.searchParams.get("userId");

          if (accessToken && userIdStr) {
            console.debug("[LoginPage] applying token from next");
            applyAuth(accessToken);
            const { setUser } = useAuthStore.getState();
            setUser({ userId: Number(userIdStr) });

            // 주소 정리 후 홈으로(무한루프 방지)
            try {
              window.history.replaceState(null, "", PATH.ROOT);
            } catch {
              //
            }
            navigate(PATH.HOME, { replace: true });
            return;
          }
        }
      } catch (err) {
        console.debug("[LoginPage] next parse failed:", err);
      }
    }

    // 이미 로그인된 경우 홈으로
    if (localStorage.getItem("accessToken")) {
      navigate(PATH.HOME, { replace: true });
    }
  }, [navigate]);

  const handleEmailBlur = async () => {
    const trimmedEmail = email.trim();

    // 1) 빈 이메일
    if (!trimmedEmail) {
      setEmailError("이메일을 입력해주세요.");
      return;
    }

    // 2) 이메일 형식 유효성
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError("유효한 이메일 형식을 입력해주세요.");
      return;
    }

    // 형식이 맞으면 에러 초기화
    setEmailError("");
  };

  const validateForm = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setFormError("");

    if (!email) {
      setEmailError("이메일을 입력해주세요.");
      valid = false;
    }
    if (!password) {
      setPasswordError("비밀번호를 입력해주세요.");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = await postLogin(email, password);
      if (!data.accessToken || data.userId == null) {
        throw new Error("로그인 응답에 토큰 또는 userId가 없습니다.");
      }

      const params = new URLSearchParams(location.search);
      const next = params.get("next") ?? undefined;

      handleLoginSuccess({
        userId: data.userId,
        accessToken: data.accessToken,
        redirectTo: next, // 없으면 HOME으로
      });
    } catch (error: any) {
      console.error("로그인 실패:", error);

      // 서버 에러 메시지 우선 사용
      const serverMessage =
        error?.response?.data?.error?.message || error?.response?.data?.message;

      if (serverMessage) {
        setFormError(serverMessage);
      } else {
        setFormError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* 좌측 비주얼: md 이상에서만 표시 */}
      <div className="hidden md:block md:w-1/2">
        <img
          src={onboarding_image}
          alt="login visual"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 우측 폼 영역: 모바일 풀폭, 데스크톱 절반 */}
      <div className="w-full md:w-1/2 flex justify-center items-center px-4 sm:px-6 lg:px-10 py-10 md:py-0">
        <div className="w-full max-w-[560px] flex flex-col items-center gap-10">
          <h2 className="w-full text-head-32-semibold sm:text-head-48">
            로그인
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start gap-4 w-full"
          >
            <div className="flex flex-col items-start w-full">
              <Input
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="이메일을 입력해주세요"
                error={emailError}
                name="email"
              />

              <Input
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력해주세요"
                error={passwordError}
                name="password"
              />
            </div>

            {formError && (
              <p className="text-red-500 text-[14px]">{formError}</p>
            )}

            <div className="flex flex-col items-start gap-3 w-full">
              <button
                type="submit"
                className="flex justify-center items-center w-full h-12 bg-[#9737fd] rounded-lg"
                disabled={loading}
              >
                <span className="text-white text-head-20-semibold">
                  {loading ? "로그인 중..." : "로그인"}
                </span>
              </button>

              <KakaoLoginButton />
            </div>
          </form>

          <div className="w-full max-w-[200px] flex flex-col items-center gap-4">
            <h2 className="text-gray-500 text-body-16-regular">
              트러블로그가 처음이신가요?
            </h2>
            <button
              onClick={() => navigate("/signup")}
              className="text-gray-500 underline text-body-16-regular w-full text-center"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
