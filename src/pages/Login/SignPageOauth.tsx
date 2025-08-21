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
  const stateUserId = location?.state?.userId as number | undefined;
  const stateNickname = location?.state?.nickname as string | undefined;

  const [userId, setUserId] = useState<number | null>(stateUserId ?? null);
  const [nickname, setNickname] = useState(stateNickname ?? "");
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
    if (userId != null && nickname) return;
    try {
      const raw = sessionStorage.getItem("oauth_payload");
      if (raw) {
        const p = JSON.parse(raw) as { userId?: number; nickname?: string };
        if (p?.userId && !userId) setUserId(p.userId);
        if (p?.nickname && !nickname) setNickname(p.nickname);
      }
    } catch (err) {
      console.debug("oauth_payload parse failed:", err);
    }
  }, [userId, nickname]);

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

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* 좌측(또는 상단) 이미지 영역 */}
      <div className="w-full md:w-1/2">
        <img
          src={onboarding_image}
          alt="signup visual"
          className="w-full h-40 xs:h-56 sm:h-72 md:h-screen object-cover"
        />
      </div>

      {/* 우측(또는 하단) 폼 영역 */}
      <div
        className="
          w-full md:w-1/2
          flex items-center justify-center
          px-5 sm:px-10 md:px-12 lg:px-16 xl:px-[200px]
          py-8 sm:py-12 md:py-16 lg:py-24 xl:py-[281px]
        "
      >
        <div className="w-full max-w-[560px] flex flex-col items-center gap-6 sm:gap-10">
          <h2 className="w-full font-pretendard font-bold text-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[48px]">
            회원가입
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start w-full gap-4"
          >
            <div className="flex flex-col items-start w-full gap-2 sm:gap-3">
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

            <div className="flex flex-col items-start gap-3 sm:gap-4 w-full">
              <button
                type="submit"
                className="w-full h-12 bg-[#9737fd] rounded-lg flex justify-center items-center"
                disabled={submitting}
              >
                <span className="text-white text-lg sm:text-[20px] font-semibold font-pretendard">
                  {submitting ? "가입 처리 중..." : "회원가입"}
                </span>
              </button>
            </div>
          </form>

          <p
            className={`text-sm sm:text-[13px] min-h-[25px] ${
              formError ? "text-red-500" : "text-transparent"
            }`}
            aria-live="polite"
          >
            {formError || " "}
          </p>

          {/* 하단 링크: 모바일 정렬 보완 */}
          <div className="flex flex-row items-end self-center md:self-end gap-3 sm:gap-4">
            <h2 className="text-base sm:text-[18px] text-gray-500 font-pretendard">
              이미 계정이 있으신가요?
            </h2>
            <button
              className="text-base sm:text-[18px] text-[#9737fd] underline font-pretendard"
              onClick={() => navigate("/")}
              type="button"
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
