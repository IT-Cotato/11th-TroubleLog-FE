import { useState } from "react";
import Input from "./Input";
import onboarding_image from "../../assets/images/onboarding_image.png";
import { useLocation, useNavigate } from "react-router-dom";
import { postRegister } from "@/api/auth.api";
import type { RegisterRequest } from "@/models/auth.model";
import { PATH } from "@/constants/paths";

const SignPageTwo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [nickname, setNickname] = useState("");
  const [field, setField] = useState("");
  const [bio, setBio] = useState("");
  const [githubad, setGithubad] = useState("");
  const { email, password } = location.state || {};

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
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (!email || !password) {
        setFormError(
          "세션이 만료되었습니다. 처음부터 회원가입을 다시 진행해 주세요."
        );
        navigate(PATH.SIGNUP);
        return;
      }
      const payload: RegisterRequest = {
        email,
        password,
        nickname,
        field,
        bio,
        githubUrl: githubad || undefined,
      };

      await postRegister(payload);
      navigate(PATH.LOGIN);
    } catch (error: any) {
      console.error("회원가입 실패:", error);
      if (error.response?.data?.message) {
        setFormError(error.response.data.message);
      } else {
        setFormError("회원가입 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      {/* 좌측 이미지 */}
      <img
        src={onboarding_image}
        className="w-1/2 h-full object-fill"
        alt="signup visual"
      />

      {/* 우측 폼 */}
      <div className="w-full lg:w-1/2 h-full px-6 sm:px-16 lg:px-[200px] py-12 sm:py-24 lg:py-[281px] flex flex-col justify-center items-center">
        <div className="w-full max-w-[560px] flex flex-col items-center gap-10">
          <h2 className="text-black text-3xl sm:text-4xl lg:text-[36px] font-bold w-full font-pretendard">
            회원가입
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start w-full gap-3"
          >
            <Input
              label="닉네임"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력해주세요."
              error={nicknameError}
              name="nickname"
            />
            <Input
              label="분야"
              type="text"
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="관심 분야를 입력해주세요."
              error={fieldError}
              name="field"
            />
            <Input
              label="한 줄 소개"
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="한 줄 소개를 입력해주세요. (50자 이내)"
              error={bioError}
              name="bio"
            />
            <Input
              label="깃허브 주소(선택)"
              type="url"
              value={githubad}
              onChange={(e) => setGithubad(e.target.value)}
              placeholder="깃허브 주소를 입력해주세요."
              name="githubad"
            />

            {formError && (
              <p
                className="text-sm text-red-500 mt-1 min-h-[10px]"
                aria-live="polite"
                role="alert"
              >
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-12 bg-[#9737fd] rounded-lg flex justify-center items-center"
            >
              <span className="text-white text-lg sm:text-xl font-semibold font-pretendard">
                회원가입
              </span>
            </button>
          </form>

          <div className="flex flex-row items-end self-end gap-4">
            <h2 className="text-sm sm:text-base md:text-lg text-gray-500 font-pretendard">
              이미 계정이 있으신가요?
            </h2>
            <button
              className="text-sm sm:text-base md:text-lg text-[#9737fd] underline font-pretendard"
              onClick={() => navigate("/")}
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignPageTwo;
