import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "./Input";
import onboarding_image from "../../assets/images/onboarding_image.png";
import { postEmailCheck } from "@/api/auth.api";
import { PATH } from "@/shared/config/paths";

const SignPageOne = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordcf, setPasswordcf] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordcfError, setPasswordcfError] = useState("");
  const [formError, setFormError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const valid =
      email.trim() !== "" &&
      password.trim() !== "" &&
      passwordcf.trim() !== "" &&
      password === passwordcf;
    setIsFormValid(valid);
  }, [email, password, passwordcf]);

  const validateForm = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setPasswordcfError("");
    setFormError("");

    if (!email) {
      setEmailError("이메일을 입력해주세요.");
      valid = false;
    }
    if (!password) {
      setPasswordError("비밀번호를 입력해주세요.");
      valid = false;
    }
    if (!passwordcf) {
      setPasswordcfError("비밀번호 확인을 입력해주세요.");
      valid = false;
    }
    if (password && passwordcf && password !== passwordcf) {
      setFormError("비밀번호가 일치하지 않습니다.");
      valid = false;
    }

    return valid;
  };

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

    try {
      await postEmailCheck(trimmedEmail);
      setEmailError(""); // 서버에서 중복 아님 -> 에러 없음
    } catch (error: any) {
      if (error.response?.status === 409) {
        setEmailError("이미 사용 중인 이메일입니다.");
      } else {
        setEmailError("이메일 확인 중 오류가 발생했습니다.");
      }
    }
  };

  const handlePasswordBlur = () => {
    if (!password.trim()) {
      setPasswordError("비밀번호를 입력해주세요.");
    } else {
      setPasswordError("");
    }
  };

  const handlePasswordcfBlur = () => {
    if (!passwordcf.trim()) {
      setPasswordcfError("비밀번호 확인을 입력해주세요.");
    } else {
      setPasswordcfError("");
    }

    if (password && passwordcf && password !== passwordcf) {
      setFormError("비밀번호가 일치하지 않습니다.");
    } else {
      setFormError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    navigate("/signup/detail", {
      state: {
        email,
        password,
      },
    });
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <img src={onboarding_image} className="w-1/2 h-full object-fill" />
      <div className="w-full lg:w-1/2 h-full scale-[0.8] px-6 sm:px-16 lg:px-[200px] py-12 sm:py-24 lg:py-[281px] flex flex-col justify-center items-center">
        <div className="w-full max-w-[560px] flex flex-col items-center gap-10">
          <h2 className="text-black text-3xl sm:text-4xl lg:text-[36px] font-bold w-full font-pretendard">
            회원가입
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
                error={emailError}
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
              <Input
                label="비밀번호 확인"
                type="password"
                value={passwordcf}
                onChange={(e) => setPasswordcf(e.target.value)}
                onBlur={handlePasswordcfBlur}
                placeholder="비밀번호를 입력해주세요."
                error={passwordcfError}
              />
            </div>

            {formError && (
              <p className="text-red-500 text-[16px] mt-1">{formError}</p>
            )}

            <div className="flex flex-col items-start gap-4 w-full">
              <button
                type="submit"
                disabled={!isFormValid}
                className="w-full h-12 bg-[#9737fd] rounded-lg flex justify-center items-center disabled:opacity-50"
              >
                <span className="text-white text-[20px] font-semibold font-pretendard">
                  다음으로
                </span>
              </button>
            </div>
          </form>

          <div className="flex flex-row items-end self-end gap-4">
            <h2 className="text-[18px] text-gray-500 font-pretendard">
              이미 계정이 있으신가요?
            </h2>
            <button
              className="text-[18px] text-[#9737fd] underline font-pretendard"
              onClick={() => navigate(PATH.LOGIN)}
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignPageOne;
