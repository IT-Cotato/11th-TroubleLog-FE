import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "./Input";
import mockimg from "../../assets/images/mockimg.jpg";
import KakaoLoginButton from "./KakaoLoginButton";
import { postLogin } from "@/api/auth.api";
import { PATH } from "@/constants/paths";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      localStorage.setItem("accessToken", data.accessToken);

      // next 또는 홈으로 이동
      const params = new URLSearchParams(location.search);
      const next = params.get("next");
      navigate(next || PATH.HOME, { replace: true });
    } catch (error: any) {
      console.error("로그인 실패:", error);
      if (error.response?.data?.message) {
        setFormError(error.response.data.message);
      } else {
        setFormError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <img
        src={mockimg}
        alt="login visual"
        className="w-1/2 h-full object-cover"
      />
      <div className="w-1/2 h-full flex justify-center items-center">
        <div className="w-[560px] flex flex-col items-center gap-10">
          <h2 className="text-black font-bold text-[48px] w-full font-pretendard">
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
                <span className="text-white font-semibold text-[20px] font-pretendard">
                  {loading ? "로그인 중..." : "로그인"}
                </span>
              </button>

              <KakaoLoginButton />
            </div>
          </form>

          <div className="w-[200px] flex flex-col items-center gap-4">
            <h2 className="text-gray-500 text-[18px] font-pretendard">
              트러블로그가 처음이신가요?
            </h2>
            <button
              onClick={() => navigate("/signup")}
              className="text-gray-500 underline text-[18px] font-pretendard w-full text-center"
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
