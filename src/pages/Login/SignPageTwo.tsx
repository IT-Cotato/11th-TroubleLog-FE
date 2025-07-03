import { useState } from "react";
import Input from "./Input";
import "./SignPageTwo.css";
import mockimg from "../../assets/images/mockimg.jpg";

const SignPageTwo = () => {
  const [nickname, setNickname] = useState("");
  const [field, setField] = useState("");
  const [bio, setBio] = useState("");
  const [githubad, setGithubad] = useState("");

  const [nicknameError, setNicknameError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [bioError, setBioError] = useState("");
  const [formError, setFormError] = useState("");

  const validateForm = () => {
    let valid = true;
    setNicknameError("");
    setFieldError("");
    setBioError("");
    setFormError("");

    if (!nickname) {
      setNicknameError("닉네임 입력해주세요.");
      valid = false;
    }
    if (!field) {
      setFieldError("관심분야를 입력해주세요.");
      valid = false;
    }
    if (!bio) {
      setBioError("한 줄 소개를 입력해주세요.");
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
                label="닉네임"
                type="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력해주세요."
                error={nicknameError}
                name="nickname"
              />

              <Input
                label="분야"
                type="field"
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="관심 분야를 입력해주세요."
                error={fieldError}
                name="field"
              />
              <Input
                label="한 줄 소개"
                type="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="한 줄 소개를 입력해주세요. (50자 이내)"
                error={bioError}
                name="bio"
              />
              <Input
                label="깃허브 주소(선택)"
                type="githubad"
                value={githubad}
                onChange={(e) => setGithubad(e.target.value)}
                placeholder="깃허브 주소를 입력해주세요."
                error={""}
                name="githubad"
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

export default SignPageTwo;
