import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Input from "./Input";
import onboarding_image from "../../assets/images/onboarding_image.png";
import { PATH } from "@/shared/config/paths";
import { postKakaoIntegration } from "@/api/auth.api";

type Step = "confirm" | "input" | "complete";

const KakaoIntegration = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;

  // 카카오 로그인 단계어서 넘겨주는 정보
  const socialId: string = location?.state?.socialId ?? "";
  const profileImgUrl: string = location?.state?.profileImgUrl ?? "";

  const [step, setStep] = useState<Step>("confirm");

  // 2단계에서 사용되는 입력값
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 에러 / 로딩
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // 로그인되어 있으면 홈으로 보내기 (선택사항)
  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate(PATH.HOME, { replace: true });
    }
  }, [navigate]);

  const resetErrors = () => {
    setEmailError("");
    setPasswordError("");
    setFormError("");
  };

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setEmailError("이메일을 입력해주세요.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("유효한 이메일 형식을 입력해주세요.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) {
      setPasswordError("비밀번호를 입력해주세요.");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // ✅ Step 1 → Step 2 (계정 연동하기 클릭 시 input 단계로 이동)
  const handleIntegrate = () => {
    resetErrors();
    setStep("input");
  };

  // Step 2 "다음으로" → Step 3
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    const emailValid = validateEmail(email);
    const pwValid = validatePassword(password);
    if (!emailValid || !pwValid) return;

    if (!socialId) {
      setFormError("카카오 계정 정보가 유효하지 않습니다. 다시 시도해주세요.");
      return;
    }

    try {
      setLoading(true);

      await postKakaoIntegration({
        email,
        password,
        socialId,
        proflImgUrl: profileImgUrl,
      });

      // 검증/연동 성공 시 3단계로 이동
      setStep("complete");
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.error?.message ??
        "계정 확인 중 오류가 발생했습니다.";
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate(PATH.LOGIN);
  };

  const renderTitle = () => {
    if (step === "complete") return "계정 통합 완료";
    return "카카오 통합 연동하기";
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Left visual */}
      <div className="hidden md:block md:w-1/2">
        <img
          src={onboarding_image}
          alt="kakao integration visual"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right content */}
      <div className="w-full md:w-1/2 flex justify-center items-center px-4 sm:px-6 lg:px-10 py-10 md:py-0">
        <div className="w-full max-w-[560px] flex flex-col items-center">
          <h2 className="w-full text-head-48 sm:text-head-48 pb-10">
            {renderTitle()}
          </h2>

          {/* ---------------------------------- */}
          {/* STEP 1: 계정 연동 확인 안내 */}
          {/* ---------------------------------- */}
          {step === "confirm" && (
            <div className="flex flex-col items-start w-full">
              <div className="mb-6 text-body-18-regular text-gray-700 leading-relaxed">
                <p className="mb-2">기존 계정이 확인되었습니다.</p>

                <p className="mb-2">
                  해당 이메일은 이미 Troublog 계정으로 가입되어 있습니다.
                  <br />
                  카카오 계정과 기존 계정을 연동하시겠습니까?
                </p>

                <p className="mb-2">
                  연동 시, 두 계정이 하나로 통합되며
                  <br />
                  기존의 트러블슈팅 기록과 데이터가 그대로 유지됩니다.
                </p>
              </div>

              {formError && (
                <p className="text-red-500 text-[14px]">{formError}</p>
              )}

              <button
                type="button"
                onClick={handleIntegrate}
                disabled={loading}
                className="mt-2 flex justify-center items-center w-full h-12 bg-[#9737fd] rounded-lg"
              >
                <span className="text-white text-head-20-semibold">
                  {loading ? "연동 중..." : "계정 연동하기"}
                </span>
              </button>

              <button
                type="button"
                className="mt-3 self-end text-body-16-regular text-primary underline"
                onClick={handleGoToLogin}
              >
                기존 계정으로 로그인하기
              </button>
            </div>
          )}

          {/* ---------------------------------- */}
          {/* STEP 2: 이메일 + 비밀번호 입력 */}
          {/* ---------------------------------- */}
          {step === "input" && (
            <form
              onSubmit={handleNext}
              className="flex flex-col items-start gap-4 w-full"
            >
              <Input
                label="이메일"
                type="email"
                placeholder="user@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateEmail(email)}
                error={emailError}
                name="email"
              />

              <Input
                label="비밀번호"
                type="password"
                placeholder="비밀번호를 입력해주세요."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => validatePassword(password)}
                error={passwordError}
                name="password"
              />

              {formError && (
                <p className="text-red-500 text-[14px]">{formError}</p>
              )}

              <button
                type="submit"
                className="mt-6 flex justify-center items-center w-full h-12 bg-[#9737fd] rounded-lg"
                disabled={loading}
              >
                <span className="text-white text-head-20-semibold">
                  {loading ? "확인 중..." : "다음으로"}
                </span>
              </button>
            </form>
          )}

          {/* ---------------------------------- */}
          {/* STEP 3: 계정 통합 완료 */}
          {/* ---------------------------------- */}
          {step === "complete" && (
            <div className="flex flex-col items-start gap-6 w-full">
              <div className="mb-10 text-body-18-regular text-gray-700 leading-relaxed">
                <p className="mb-2">계정 연동이 완료되었습니다!</p>

                <p className="mb-2">
                  이제 카카오 로그인으로 간편하게 Troublog를 이용할 수 있습니다.
                  <br />
                  기존 데이터와 트러블슈팅 기록은 모두 안전하게 유지됩니다.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoToLogin}
                className="flex justify-center items-center w-full h-12 bg-[#9737fd] rounded-lg"
              >
                <span className="text-white text-head-20-semibold">
                  통합 로그인하기
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KakaoIntegration;
