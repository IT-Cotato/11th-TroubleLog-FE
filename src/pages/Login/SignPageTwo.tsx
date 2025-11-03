import { useEffect, useRef, useState } from "react";
import Input from "./Input";
import onboarding_image from "../../assets/images/onboarding_image.png";
import { useLocation, useNavigate } from "react-router-dom";
import { postRegister } from "@/api/auth.api";
import type { RegisterRequest } from "@/models/auth.model";
import { PATH } from "@/shared/config/paths";
import TermsField from "./TermsField";

const DRAFT_KEY = "signTwoDraft";

const SignPageTwo = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [nickname, setNickname] = useState("");
  const [field, setField] = useState("");
  const [bio, setBio] = useState("");
  const [githubad, setGithubad] = useState("");
  const { email, password } = location.state || {};

  const [nicknameError, setNicknameError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [bioError, setBioError] = useState("");
  const [formError, setFormError] = useState("");

  // 단일 체크박스(= 두 약관 전체 동의)
  const [agreeError, setAgreeError] = useState("");

  // 내부적으로 payload에 쓸 상세 동의 상태(1:이용약관, 2:개인정보)
  const [agreeMap, setAgreeMap] = useState<{ "1": boolean; "2": boolean }>({
    "1": false,
    "2": false,
  });

  const hydratedRef = useRef(false);

  // 약관 상세 → 복귀 시 상태 반영 + 최초 진입 시 draft 복구
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;

      // 1) 라우터 state formDraft 우선
      const stateDraft = location.state?.formDraft;

      // 2) fallback: sessionStorage
      const savedRaw = sessionStorage.getItem(DRAFT_KEY);
      const savedDraft = savedRaw ? JSON.parse(savedRaw) : null;

      const draft = stateDraft || savedDraft;

      if (draft) {
        setNickname(draft.nickname ?? "");
        setField(draft.field ?? "");
        setBio(draft.bio ?? "");
        setGithubad(draft.githubad ?? "");

        if (draft.termsAgreements) {
          setAgreeMap(draft.termsAgreements);
        }

        if (draft.email)
          location.state = { ...(location.state || {}), email: draft.email };
        if (draft.password)
          location.state = {
            ...(location.state || {}),
            password: draft.password,
          };
      }
    }

    // 약관 동의 상태(location.state 경유) 반영
    const fromTerms = location.state?.fromTerms as boolean | undefined;
    const agreeTerms = location.state?.agreeTerms as boolean | undefined;
    const agreePrivacy = location.state?.agreePrivacy as boolean | undefined;

    if (
      fromTerms &&
      typeof agreeTerms === "boolean" &&
      typeof agreePrivacy === "boolean"
    ) {
      const both = agreeTerms && agreePrivacy;
      setAgreeMap({ "1": !!agreeTerms, "2": !!agreePrivacy });
      if (both) setAgreeError("");
    }
  }, [location.state]);

  // 입력/동의 값이 바뀔 때마다 sessionStorage에 드래프트 저장
  useEffect(() => {
    const draft = {
      nickname,
      field,
      bio,
      githubad,
      email,
      termsAgreements: agreeMap,
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [nickname, field, bio, githubad, agreeMap, email, password]);

  // 폼 유효성
  const isFormValid =
    nickname.trim() !== "" &&
    field.trim() !== "" &&
    bio.trim() !== "" &&
    agreeMap["1"] &&
    agreeMap["2"];

  // 간단 검증
  const validateForm = () => {
    let valid = true;
    setNicknameError("");
    setFieldError("");
    setBioError("");
    setFormError("");
    setAgreeError("");

    if (!nickname.trim()) {
      setNicknameError("닉네임을 입력해주세요.");
      valid = false;
    }
    if (!field.trim()) {
      setFieldError("관심 분야를 입력해주세요.");
      valid = false;
    }
    if (!bio.trim()) {
      setBioError("한 줄 소개를 입력해주세요.");
      valid = false;
    }
    if (!(agreeMap["1"] && agreeMap["2"])) {
      setAgreeError("이용약관 및 개인정보처리방침에 동의해 주세요.");
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
        termsAgreements: {
          "1": !!agreeMap["1"],
          "2": !!agreeMap["2"],
        },
      };

      await postRegister(payload);
      sessionStorage.removeItem("termsAgreements");
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

      {/* 우측 폼 래퍼 (기존 스타일 유지) */}
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
                label="닉네임"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력해주세요."
                error={nicknameError}
                name="nickname"
              />
              <Input
                label="관심 분야"
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

              {/* 약관 진입 버튼 */}
              <TermsField
                label="이용약관 및 개인정보처리방침"
                onOpen={() => {
                  const formDraft = {
                    nickname,
                    field,
                    bio,
                    githubad,
                    email,
                    termsAgreements: agreeMap,
                  };
                  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(formDraft));
                  navigate(PATH.TERMS, {
                    state: {
                      returnTo: location.pathname,
                      formDraft,
                    },
                  });
                }}
                error={agreeError}
                describedBy="terms-error"
              />

              {/* 단일 '동의합니다' 체크 → 두 약관 모두 동의로 반영 */}
              <div className="w-full -mt-6 mb-4 flex items-center justify-end">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeMap["1"] && agreeMap["2"]}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setAgreeMap({ "1": v, "2": v }); // 두 약관 동기화
                      if (v) setAgreeError("");
                    }}
                    className="w-5 h-5 accent-[#9737fd]"
                    aria-invalid={!!agreeError}
                    aria-describedby="terms-error"
                  />
                  <span className="text-sm md:text-base text-gray-700">
                    동의합니다.
                  </span>
                </label>
              </div>
            </div>

            {formError && (
              <p
                className="text-red-500 text-[16px] mt-1"
                role="alert"
                aria-live="polite"
              >
                {formError}
              </p>
            )}

            <div className="flex flex-col items-start gap-4 w-full">
              <button
                type="submit"
                disabled={!isFormValid}
                className="w-full h-12 bg-[#9737fd] rounded-lg flex justify-center items-center disabled:opacity-50"
              >
                <span className="text-white text-[20px] font-semibold font-pretendard">
                  회원가입
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

export default SignPageTwo;
