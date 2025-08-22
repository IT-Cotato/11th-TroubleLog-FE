import { useEffect, useState } from "react";
import Input from "./Input";
import onboarding_image from "../../assets/images/onboarding_image.png";
import { useLocation, useNavigate } from "react-router-dom";
import { postOauthRegister } from "@/api/auth.api";
import type { OauthRegisterRequest } from "@/models/auth.model";
import { PATH } from "@/constants/paths";

const SignPageOauth = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;

  // location.state에서 넘어온 값 (카카오 인증 직후)
  const stateUserId = location?.state?.userId as number | undefined;
  const stateKakaoNickname = location?.state?.nickname as string | undefined;

  // 카카오 원본 정보 (읽기 전용)
  const [userId, setUserId] = useState<number | null>(stateUserId ?? null);
  const [kakaoNickname, setKakaoNickname] = useState<string>(
    stateKakaoNickname ?? ""
  );

  // 사용자 입력용
  const [nickname, setNickname] = useState<string>(""); // 서비스에서 사용할 닉네임
  const [field, setField] = useState("");
  const [bio, setBio] = useState("");
  const [githubad, setGithubad] = useState("");

  const [nicknameError, setNicknameError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [bioError, setBioError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 새로고침 폴백
  useEffect(() => {
    if (userId != null && kakaoNickname) return;
    try {
      const raw = sessionStorage.getItem("oauth_payload");
      if (raw) {
        const p = JSON.parse(raw) as { userId?: number; nickname?: string };
        if (p?.userId && !userId) setUserId(p.userId);
        if (p?.nickname && !kakaoNickname) setKakaoNickname(p.nickname);
      }
    } catch (err) {
      console.debug("oauth_payload parse failed:", err);
    }
  }, [userId, kakaoNickname]);

  // UX: 사용자 입력 닉네임이 비어있다면, 카카오 닉네임을 기본값으로 채워줌
  useEffect(() => {
    if (!nickname && kakaoNickname) {
      setNickname(kakaoNickname);
    }
  }, [kakaoNickname, nickname]);

  const validateForm = () => {
    let valid = true;
    setNicknameError("");
    setFieldError("");
    setBioError("");
    setFormError("");

    if (!nickname.trim()) {
      setNicknameError("닉네임을 입력해주세요.");
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
    if (!userId) {
      setFormError(
        "카카오 로그인 정보가 없습니다. 처음부터 다시 시도해주세요."
      );
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
        userId: userId!, // 카카오로 받은 ID
        kakaoNickname: kakaoNickname.trim(),
        nickname: nickname.trim(),
        field: field.trim(),
        bio: bio.trim(),
        githubUrl: githubad.trim() || undefined,
      };

      await postOauthRegister(payload);

      // 서버가 302로 루트/?next=... 로 보낼 수도 있으니,
      // 일단 홈으로 이동 (LoginPage에서 next 처리도 있으니 double-safe)
      navigate(PATH.HOME, { replace: true });
    } catch (error: any) {
      console.error("회원가입 실패:", error);

      const status = error?.response?.status as number | undefined;
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        "";

      const fieldErrors: Array<{ field?: string; message?: string }> =
        error?.response?.data?.errors || [];

      // 1) 필드 에러에서 nickname 관련 메시지
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

  // responsive SignPageOauth (Tailwind)
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr] lg:grid-rows-1 lg:grid-cols-2 overflow-hidden bg-white">
      {/* 이미지: 모바일/태블릿에선 상단 배너, 데스크탑에선 좌측 패널 */}
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-auto order-1 lg:order-none">
        <img
          src={onboarding_image}
          alt="signup visual"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* 폼 컨테이너 */}
      <div className="flex h-full items-center justify-center px-4 py-8 sm:px-8 md:px-12 lg:px-16">
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-[560px] flex flex-col items-center gap-8">
          <h2 className="w-full text-black text-3xl sm:text-4xl md:text-[48px] font-bold font-pretendard">
            회원가입
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start w-full gap-0"
          >
            <div className="flex flex-col items-start w-full gap-0">
              {/* 카카오 닉네임 (읽기) */}
              <Input
                label="카카오 닉네임"
                type="text"
                value={kakaoNickname}
                onChange={() => {}}
                placeholder="카카오에서 전달된 닉네임"
                error={""}
                name="kakaoNickname"
              />
              <p className="text-xs text-gray-500 -mt-2 mb-3">
                카카오에서 받은 닉네임이며, 계정 식별을 위해 그대로 저장됩니다.
              </p>

              {/* 사용자 입력 필드들 */}
              <Input
                label="닉네임"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="서비스에서 사용할 닉네임을 입력해주세요."
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

            <div className="flex flex-col items-start gap-4 w-full mt-4">
              <button
                type="submit"
                className="w-full h-12 bg-[#9737fd] rounded-lg flex justify-center items-center disabled:opacity-60 transition-colors hover:bg-[#8428f6]"
                disabled={submitting}
              >
                <span className="text-white text-lg sm:text-[20px] font-semibold font-pretendard">
                  {submitting ? "가입 처리 중..." : "회원가입"}
                </span>
              </button>
            </div>
          </form>

          <p
            className={`text-[13px] min-h-[25px] ${
              formError ? "text-red-500" : "text-transparent"
            }`}
            aria-live="polite"
          >
            {formError || " "}
          </p>

          <div className="flex flex-row items-end self-end gap-4">
            <h2 className="text-sm sm:text-base md:text-[18px] text-gray-500 font-pretendard">
              이미 계정이 있으신가요?
            </h2>
            <button
              className="text-sm sm:text-base md:text-[18px] text-[#9737fd] underline font-pretendard"
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
