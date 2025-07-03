import { useState } from "react";
import Input from "./Input";
import "./SignPageone.css";
import mockimg from "../../assets/images/mockimg.jpg";

const SignPageOne = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

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
  };

  return (
    <div className="big">
      <img src={mockimg} className="mockimg" />
      <div className="LoginWrapper">
        <div className="LoginBox">
          <h2 className="LoginTitle">회원가입</h2>

          <form onSubmit={handleSubmit} className="LoginForm">
            <div className="LoginInputWrapper">
              <Input
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력해주세요."
                error={emailError}
                name="email"
              />

              <Input
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력해주세요."
                error={passwordError}
                name="password"
              />
              <Input
                label="비밀번호 확인"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력해주세요."
                error={passwordError}
                name="password"
              />
            </div>

            {formError && <p className="FormError">{formError}</p>}
            <div className="BottomWrapper">
              <button type="submit" className="LoginButton">
                <span className="LoginText">다음으로</span>
              </button>
            </div>
          </form>

          <div className="HaveAcWrapper">
            <h2 className="HaveAcTitle">이미 계정이 있으신가요?</h2>
            <button className="ConnectSignup">로그인</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignPageOne;
