import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "./Input";
import "./SignPageone.css";
import mockimg from "../../assets/images/mockimg.jpg";

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

  const handleEmailBlur = () => {
    if (!email.trim()) {
      setEmailError("이메일을 입력해주세요.");
    } else {
      setEmailError("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    navigate("/signuptwo");
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

            {formError && <p className="FormError">{formError}</p>}
            <div className="BottomWrapper">
              <button
                type="submit"
                className="LoginButton"
                disabled={!isFormValid}
              >
                <span className="LoginText">다음으로</span>
              </button>
            </div>
          </form>

          <div className="HaveAcWrapper">
            <h2 className="HaveAcTitle">이미 계정이 있으신가요?</h2>
            <button className="ConnectSignup" onClick={() => navigate("/")}>
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignPageOne;
