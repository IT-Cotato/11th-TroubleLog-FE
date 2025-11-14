import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "./Input";
import onboarding_image from "../../assets/images/onboarding_image.png";
import { postEmailCheck } from "@/api/auth.api";

const CombineSignPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState<{
    message: string;
    action?: string;
  } | null>(null);

  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();

  //   const AUTH_START_URL = useMemo(() => {
  //     const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  //     const callback = `${window.location.origin}${base}${PATH.OAUTH_REGISTER}`;
  //     return `https://troublog.shop/oauth2/authorization/kakao?return_to=${encodeURIComponent(
  //       callback
  //     )}`;
  //   }, []);

  // 폼 전체 유효성 체크
  useEffect(() => {
    setIsFormValid(email.trim() !== "" && password.trim() !== "");
  }, [email, password]);

  const validateForm = () => {
    let valid = true;

    setEmailError(null);
    setPasswordError("");
    setFormError("");

    if (!email) {
      setEmailError({ message: "이메일을 입력해주세요." });
      valid = false;
    }

    if (!password) {
      setPasswordError("비밀번호를 입력해주세요.");
      valid = false;
    }

    return valid;
  };

  // 이메일 확인: 연동 조건 (DB에 존재해야 OK)
  const handleEmailBlur = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError({ message: "이메일을 입력해주세요." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError({ message: "유효한 이메일 형식을 입력해주세요." });
      return;
    }

    setEmailError(null);

    try {
      // 200이면 가입된 이메일이 아님 → 연동 불가
      await postEmailCheck(trimmedEmail);

      setEmailError({
        message: "가입된 이메일이 아닙니다. 기존 계정으로 먼저 가입해주세요.",
      });
    } catch (error: any) {
      if (error.response?.status === 409) {
        // 이메일이 이미 존재 → 연동 가능
        setEmailError(null);
      } else {
        setEmailError({
          message: "이메일 확인 중 오류가 발생했습니다.",
        });
      }
    }
  };

  const handlePasswordBlur = () => {
    setPasswordError(password.trim() ? "" : "비밀번호를 입력해주세요.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    navigate("/signup/detail", {
      state: { email, password },
    });
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <img src={onboarding_image} className="w-1/2 h-full object-fill" />

      <div className="w-full lg:w-1/2 h-full scale-[0.8] px-6 sm:px-16 lg:px-[200px] py-12 sm:py-24 lg:py-[281px] flex flex-col justify-center items-center">
        <div className="w-full max-w-[560px] flex flex-col items-center gap-10">
          <h2 className="text-black text-3xl sm:text-4xl lg:text-[36px] font-bold w-full font-pretendard">
            카카오 통합회원 연동
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
                placeholder="이메일을 입력해주세요."
                error={emailError?.message}
              />

              <Input
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                placeholder="비밀번호를 입력해주세요."
                error={passwordError}
              />
            </div>

            {formError && (
              <p className="text-red-500 text-[16px] mt-1">{formError}</p>
            )}

            <div className="flex flex-col items-start gap-4 w-full">
              <button
                type="submit"
                disabled={!isFormValid || !!emailError}
                className="w-full h-12 bg-[#9737fd] rounded-lg flex justify-center items-center disabled:opacity-50"
              >
                <span className="text-white text-[20px] font-semibold font-pretendard">
                  완료
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CombineSignPage;
