import { useEffect, useRef, useState } from "react";
import Input from "./Input";
import TermsField from "./TermsField";
import onboarding_image from "../../assets/images/onboarding_image.png";
import { useLocation, useNavigate } from "react-router-dom";
import { postOauthRegister } from "@/api/auth.api";
import type {
  OauthRegisterRequest,
  OauthRegisterResponse,
} from "@/models/auth.model";
import { PATH } from "@/shared/config/paths";
import { handleLoginSuccess } from "@/utils/handleLoginSuccess";

const DRAFT_KEY = "signOauthDraft"; // OAuth 전용 드래프트 키

const SignPageOauth = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;

  // 카카오 인증 직후 전달되는 값
  const stateUserId = location?.state?.userId as number | undefined;
  const stateKakaoNickname = location?.state?.nickname as string | undefined;

  // OAuth 원본 정보 (UI에 노출 X)
  const [userId, setUserId] = useState<number | null>(stateUserId ?? null);
  const [kakaoNickname, setKakaoNickname] = useState<string | null>(
    stateKakaoNickname ?? null
  );

  // 사용자 입력
  const [nickname, setNickname] = useState("");
  const [field, setField] = useState("");
  const [bio, setBio] = useState("");
  const [githubad, setGithubad] = useState("");

  // 에러 상태
  const [nicknameError, setNicknameError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [bioError, setBioError] = useState("");
  const [formError, setFormError] = useState("");
  const [agreeError, setAgreeError] = useState("");

  // 약관 동의(내부 payload용 상세 동의: 1=이용약관, 2=개인정보)
  const [agreeMap, setAgreeMap] = useState<{ "1": boolean; "2": boolean }>({
    "1": false,
    "2": false,
  });

  const [submitting, setSubmitting] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (userId != null && kakaoNickname != null) return;
    try {
      const raw = sessionStorage.getItem("oauth_payload");
      if (!raw) return;

      const p = JSON.parse(raw) as {
        userId?: number;
        nickname?: string;
      };

      if (p.userId && !userId) {
        setUserId(p.userId);
      }
      if (p.nickname && !kakaoNickname) {
        // oauth_payload.nickname 을 카카오 원본 닉네임으로 사용
        setKakaoNickname(p.nickname);
      }
    } catch {
      /* noop */
    }
  }, [userId, kakaoNickname]);

  // 약관 상세 → 복귀 시 상태 반영 + 최초 진입 시 draft 복구
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;

      // 1) 라우터 state의 formDraft 우선
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
        if (typeof draft.userId === "number") setUserId(draft.userId);
        if (typeof draft.kakaoNickname === "string") {
          setKakaoNickname(draft.kakaoNickname);
        }
        if (draft.termsAgreements) {
          setAgreeMap({
            "1": !!draft.termsAgreements["1"],
            "2": !!draft.termsAgreements["2"],
          });
        }
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
      userId,
      kakaoNickname,
      nickname,
      field,
      bio,
      githubad,
      termsAgreements: agreeMap,
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [userId, kakaoNickname, nickname, field, bio, githubad, agreeMap]);

  // 폼 유효성
  const isFormValid =
    !!userId &&
    nickname.trim() !== "" &&
    field.trim() !== "" &&
    bio.trim() !== "" &&
    agreeMap["1"] &&
    agreeMap["2"];

  const validateForm = () => {
    let valid = true;
    setNicknameError("");
    setFieldError("");
    setBioError("");
    setFormError("");
    setAgreeError("");

    if (!userId) {
      setFormError(
        "카카오 로그인 정보가 없습니다. 처음부터 다시 시도해주세요."
      );
      valid = false;
    }
    if (!nickname.trim()) {
      setNicknameError("닉네임 입력해주세요.");
      valid = false;
    }
    if (!field.trim()) {
      setFieldError("관심분야를 입력해주세요.");
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
    if (!validateForm() || submitting) return;

    setSubmitting(true);
    try {
      const payload: OauthRegisterRequest = {
        userId: userId!, // 카카오에서 받은 필수 ID
        kakaoNickname: kakaoNickname ?? nickname.trim(),
        nickname: nickname.trim(),
        field: field.trim(),
        bio: bio.trim(),
        githubUrl: githubad.trim() || undefined,
        termsAgreements: { ...agreeMap },
      };

      const data: OauthRegisterResponse = await postOauthRegister(payload);

      if (data.userId == null) {
        throw new Error("회원가입 응답에 userId가 없습니다.");
      }

      // 드래프트 삭제
      sessionStorage.removeItem(DRAFT_KEY);

      handleLoginSuccess({
        userId: data.userId,
        accessToken: data.accessToken!,
        // redirectTo 생략 시 HOME
      });
    } catch (error: any) {
      console.error("회원가입 실패:", error);

      const status = error?.response?.status as number | undefined;
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        "";

      const fieldErrors: Array<{ field?: string; message?: string }> =
        error?.response?.data?.errors || [];

      const nickFieldErr =
        fieldErrors.find((e) => (e.field || "").toLowerCase() === "nickname") ||
        fieldErrors.find((e) => (e.message || "").includes("닉네임"));

      if (
        status === 409 ||
        /duplicate|이미|중복/i.test(message) ||
        nickFieldErr
      ) {
        setNicknameError("이미 사용 중인 닉네임입니다.");
        setFormError("");
      } else if (message) {
        setFormError(message);
      } else {
        setFormError("회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      {/* 좌측 이미지 (SignPageTwo와 동일) */}
      <img
        src={onboarding_image}
        className="w-1/2 h-full object-fill"
        alt="signup visual"
      />

      {/* 우측 폼 래퍼 */}
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

              {/* 약관/개인정보 동의 영역 */}
              <TermsField
                label="이용약관 및 개인정보처리방침"
                onOpen={() => {
                  const formDraft = {
                    userId,
                    nickname,
                    field,
                    bio,
                    githubad,
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

              {/* 단일 '동의합니다' 체크 → 두 약관 모두 동기화 */}
              <div className="w-full -mt-6 mb-4 flex items-center justify-end">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeMap["1"] && agreeMap["2"]}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setAgreeMap({ "1": v, "2": v });
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

            {/* 상단 폼 에러 */}
            {formError && (
              <p
                className="text-red-500 text-[16px] mt-1"
                aria-live="polite"
                role="alert"
              >
                {formError}
              </p>
            )}

            <div className="flex flex-col items-start gap-4 w-full">
              <button
                type="submit"
                className="w-full h-12 bg-[#9737fd] rounded-lg flex justify-center items-center disabled:opacity-50"
                disabled={submitting || !isFormValid}
              >
                <span className="text-white text-[20px] font-semibold font-pretendard">
                  {submitting ? "가입 처리 중..." : "회원가입"}
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

export default SignPageOauth;
