import { useState } from "react";
import Input from "./Input";
import mockimg from "../../assets/images/mockimg.jpg";
import { useNavigate } from "react-router-dom";
import { postOauthRegister } from "@/api/auth.api";
import type { OauthRegisterRequest } from "@/models/auth.model";
import { PATH } from "@/constants/paths";

const SignPageOauth = () => {
  const navigate = useNavigate();

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
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload: OauthRegisterRequest = {
        userId: 0, // 수정 필요
        nickname,
        field,
        bio,
        githubUrl: githubad || undefined,
      };

      await postOauthRegister(payload);
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
      <img
        src={mockimg}
        className="w-[961.807px] h-full object-cover shrink-0"
        alt="signup visual"
      />
      <div className="w-[960px] h-full px-[200px] py-[281px] flex flex-col justify-center items-center">
        <div className="w-[560px] flex flex-col items-center gap-10">
          <h2 className="text-black text-[48px] font-bold w-full font-pretendard">
            회원가입
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start w-full"
          >
            <div className="flex flex-col items-start  w-full">
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
                error={""}
                name="githubad"
              />
            </div>

            <div className="flex flex-col items-start gap-4 w-full">
              <button
                type="submit"
                className="w-full h-12 bg-[#9737fd] rounded-lg flex justify-center items-center"
              >
                <span className="text-white text-[20px] font-semibold font-pretendard">
                  회원가입
                </span>
              </button>
            </div>
          </form>
          {formError && (
            <p
              className={`text-[13px] mb min-h-[25px] transition-opacity duration-150
                ${formError ? "text-red-500 opacity-100" : "opacity-0"}`}
              aria-live={formError ? "polite" : undefined}
              role={formError ? "alert" : undefined}
              aria-hidden={!formError}
            >
              {formError}
            </p>
          )}

          <div className="flex flex-row items-end self-end gap-4">
            <h2 className="text-[18px] text-gray-500 font-pretendard">
              이미 계정이 있으신가요?
            </h2>
            <button
              className="text-[18px] text-[#9737fd] underline font-pretendard"
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

export default SignPageOauth;
