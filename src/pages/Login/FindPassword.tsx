import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "./Input";
import onboarding_image from "../../assets/images/onboarding_image.png";
import { PATH } from "@/shared/config/paths";
import {
  postChangePassword,
  postCheckCode,
  postFindPassword,
} from "@/api/auth.api";
import { isAxiosError } from "axios";

type Step = "email" | "code" | "reset";

const FindPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");

  // 1단계: 이메일
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // 2단계: 인증코드 (6자리)
  const [codeDigits, setCodeDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const codeInputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [codeError, setCodeError] = useState("");
  // 서버에서 받은 UUID (randomString)
  const [randomString, setRandomString] = useState<string | null>(null);
  // 인증이 성공한 코드(비밀번호 재설정 요청에 사용)
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);

  // 3단계: 비밀번호 재설정
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // 이미 로그인된 경우 홈으로 보내는 로직이 필요하다면 여기서 처리
  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate(PATH.HOME, { replace: true });
    }
  }, [navigate]);

  // ----- 공통 -----
  const resetErrors = () => {
    setEmailError("");
    setCodeError("");
    setPasswordError("");
    setFormError("");
  };

  // ----- 1단계: 이메일 전송 -----
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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (!validateEmail(email)) return;

    try {
      setLoading(true);

      await requestCode(email);

      setStep("code");
    } catch (err) {
      console.error(err);
      if (isAxiosError(err)) {
        const msg =
          (err.response?.data as any)?.error?.message ??
          "인증코드 전송 중 오류가 발생했습니다.";
        setFormError(msg);
      } else {
        setFormError("인증코드 전송 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const requestCode = async (targetEmail: string) => {
    const trimmed = targetEmail.trim();

    const res = await postFindPassword({ email: trimmed });
    // 응답이 { randomString: "..." } 형식이라고 가정
    setRandomString(res.randomString);
    // 새 코드 발급 시, 이전 코드/에러 초기화
    setCodeDigits(["", "", "", "", "", ""]);
    setVerifiedCode(null);
  };

  // ----- 2단계: 인증코드 입력 -----
  const handleCodeChange = (index: number, value: string) => {
    const onlyNumber = value.replace(/\D/g, "").slice(-1); // 마지막 숫자 1개만
    const next = [...codeDigits];
    next[index] = onlyNumber;
    setCodeDigits(next);

    if (onlyNumber && index < codeInputsRef.current.length - 1) {
      codeInputsRef.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      codeInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    const code = codeDigits.join("");

    if (code.length !== 6) {
      setCodeError("6자리 인증번호를 모두 입력해주세요.");
      return;
    }

    if (!randomString) {
      setFormError("인증 정보를 찾을 수 없습니다. 처음부터 다시 진행해주세요.");
      setStep("email");
      return;
    }

    try {
      setLoading(true);

      await postCheckCode({
        authCode: code,
        randomString,
      });

      // 인증 성공 → 이 코드로 change-password 호출
      setVerifiedCode(code);
      setStep("reset");
    } catch (err) {
      console.error(err);
      if (isAxiosError(err)) {
        const msg =
          (err.response?.data as any)?.error?.message ??
          "인증번호 확인 중 오류가 발생했습니다.";
        setFormError(msg);
      } else {
        setFormError("인증번호 확인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    resetErrors();
    if (!validateEmail(email)) return;

    try {
      setLoading(true);

      await requestCode(email);
    } catch (err) {
      console.error(err);
      if (isAxiosError(err)) {
        const msg =
          (err.response?.data as any)?.error?.message ??
          "인증번호 재전송 중 오류가 발생했습니다.";
        setFormError(msg);
      } else {
        setFormError("인증번호 재전송 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ----- 3단계: 비밀번호 재설정 -----
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (!password || !passwordConfirm) {
      setPasswordError("비밀번호를 모두 입력해주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    if (!randomString || !verifiedCode) {
      setFormError("이메일 인증 및 인증번호 확인을 먼저 완료해주세요.");
      return;
    }

    try {
      setLoading(true);

      await postChangePassword({
        authCode: verifiedCode,
        randomString,
        email: email.trim(),
        password,
      });

      // 완료 후 로그인 페이지로 이동
      navigate(PATH.LOGIN, { replace: true });
    } catch (err) {
      console.error(err);
      if (isAxiosError(err)) {
        const msg =
          (err.response?.data as any)?.error?.message ??
          "비밀번호 재설정 중 오류가 발생했습니다.";
        setFormError(msg);
      } else {
        setFormError("비밀번호 재설정 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ----- 렌더링 -----
  const renderTitle = () => {
    if (step === "email") return "이메일 인증하기";
    if (step === "code") return "인증번호 입력";
    return "비밀번호 재설정";
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* 좌측 비주얼 */}
      <div className="hidden md:block md:w-1/2">
        <img
          src={onboarding_image}
          alt="find password visual"
          className="w-full h-full object-cover"
        />
      </div>

      {/* 우측 폼 영역 */}
      <div className="w-full md:w-1/2 flex justify-center items-center px-4 sm:px-6 lg:px-10 py-10 md:py-0">
        <div className="w-full max-w-[560px] flex flex-col items-center">
          <h2 className="w-full text-head-32-semibold sm:text-head-48 pb-10">
            {renderTitle()}
          </h2>

          {/* 1단계: 이메일 입력 */}
          {step === "email" && (
            <form
              onSubmit={handleSendCode}
              className="flex flex-col items-start gap-4 w-full"
            >
              <Input
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateEmail(email)}
                placeholder="이메일을 입력해주세요."
                error={emailError}
                name="email"
              />

              {formError && (
                <p className="text-red-500 text-[14px]">{formError}</p>
              )}

              <button
                type="submit"
                className="mt-4 flex justify-center items-center w-full h-12 bg-[#9737fd] rounded-lg"
                disabled={loading}
              >
                <span className="text-white text-head-20-semibold">
                  {loading ? "전송 중..." : "인증코드 전송"}
                </span>
              </button>

              <button
                type="button"
                className="mt-3 text-gray-500 underline text-body-16-regular self-end"
                onClick={() => navigate(PATH.LOGIN)}
              >
                로그인으로 돌아가기
              </button>
            </form>
          )}

          {/* 2단계: 인증번호 입력 */}
          {step === "code" && (
            <form
              onSubmit={handleVerifyCode}
              className="flex flex-col items-start gap-4 w-full"
            >
              {/* 6개의 입력칸 */}
              <div className="w-full mb-2">
                <div className="grid grid-cols-6 gap-4 w-full px-4">
                  {codeDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        // ref 타입 에러 안 나게: 값만 대입하고 아무 것도 반환하지 않기
                        codeInputsRef.current[idx] = el;
                      }}
                      value={digit}
                      onChange={(e) => handleCodeChange(idx, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                      maxLength={1}
                      className={[
                        "w-full h-20 rounded-lg text-center text-head-32-semibold",
                        "focus:outline-none focus:border-[#9737fd]",
                        digit
                          ? "bg-[#F5ECFF] shadow-[1px_1px_2px_rgba(0,0,0,0.25)]" // 입력 후
                          : "border border-[#E0E0E0] bg-white", // 입력 전
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>

              {codeError && (
                <p className="text-red-500 text-[14px]">{codeError}</p>
              )}
              {formError && (
                <p className="text-red-500 text-[14px]">{formError}</p>
              )}

              <button
                type="submit"
                className="mt-4 flex justify-center items-center w-full h-12 bg-[#9737fd] rounded-lg"
                disabled={loading}
              >
                <span className="text-white text-head-20-semibold">
                  {loading ? "확인 중..." : "인증 완료"}
                </span>
              </button>

              <div className="mt-3 w-full flex justify-between text-body-14-regular text-gray-500">
                <span>인증번호를 받지 못하셨나요?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="underline"
                >
                  다시받기
                </button>
              </div>
            </form>
          )}

          {/* 3단계: 비밀번호 재설정 */}
          {step === "reset" && (
            <form
              onSubmit={handleResetPassword}
              className="flex flex-col items-start gap-4 w-full"
            >
              <Input
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력해주세요."
                name="new-password"
              />
              <Input
                label="비밀번호 확인"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 한 번 더 입력해주세요."
                name="confirm-password"
              />

              {passwordError && (
                <p className="text-red-500 text-[14px]">{passwordError}</p>
              )}
              {formError && (
                <p className="text-red-500 text-[14px]">{formError}</p>
              )}

              <button
                type="submit"
                className="mt-4 flex justify-center items-center w-full h-12 bg-[#9737fd] rounded-lg"
                disabled={loading}
              >
                <span className="text-white text-head-20-semibold">
                  {loading ? "재설정 중..." : "재설정 완료"}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindPassword;
