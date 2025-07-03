import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "./Input";
import { login } from "@/services/auth";
import "./LoginPage.css";
import mockimg from "../../assets/images/mockimg.jpg";
import KakaoLoginButton from "./KakaoLoginButton";
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const res = await login(email, password);
      localStorage.setItem("token", res.token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error(err);
      setFormError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="big">
      <img src={mockimg} className="mockimg" />
      <div className="LoginWrapper">
        <div className="LoginBox">
          <h2 className="LoginTitle">로그인</h2>

          <form onSubmit={handleSubmit} className="LoginForm">
            <div className="LoginInputWrapper">
              <Input
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            {formError && <p className="FormError">{formError}</p>}
            <div className="BottomWrapper">
              <button type="submit" className="LoginButton" disabled={loading}>
                <span className="LoginText">
                  {loading ? "로그인 중..." : "로그인"}
                </span>
              </button>
              <KakaoLoginButton />
            </div>
          </form>

          <div className="SignupWrapper">
            <h2 className="SignupTitle">트러블로그가 처음이신가요?</h2>
            <button
              className="ConnectSignup"
              onClick={() => navigate("/signup")}
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
