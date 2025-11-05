import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import onboarding_image from "@/assets/images/onboarding_image.png";
import { FiChevronLeft } from "react-icons/fi";
import { getLatestTerms } from "@/api/auth.api";
import type { TermsDto } from "@/models/auth.model";
import MarkdownLite from "./MarkdownLite";

const DRAFT_KEY = "signTwoDraft";

export default function TermsDetailPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [tos, setTos] = useState<TermsDto | null>(null);
  const [privacy, setPrivacy] = useState<TermsDto | null>(null);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const allAgreed = useMemo(
    () => agreeTerms && agreePrivacy,
    [agreeTerms, agreePrivacy]
  );
  const [agreeAll, setAgreeAll] = useState(false);

  useEffect(() => {
    setAgreeAll(allAgreed);
  }, [allAgreed]);

  const onToggleAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
  };

  const onBack = () => navigate(-1);

  const incomingDraft = (location.state?.formDraft as any) || null;

  const onConfirm = () => {
    if (!allAgreed) return;

    // 기존 draft에 동의 결과만 병합
    const mergedDraft = {
      ...(incomingDraft || {}),
      termsAgreements: { "1": true, "2": true },
    };

    // 세션 백업
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(mergedDraft));
    sessionStorage.setItem(
      "termsAgreements",
      JSON.stringify({ "1": true, "2": true })
    );

    const returnTo: string | undefined = location.state?.returnTo;
    if (returnTo) {
      navigate(returnTo, {
        state: {
          fromTerms: true,
          agreeTerms: true,
          agreePrivacy: true,
          formDraft: mergedDraft, // 폼 드래프트 되돌려주기
        },
        replace: true,
      });
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getLatestTerms();
        const list: TermsDto[] = res?.termsDtoList ?? [];

        const foundPrivacy =
          list.find((t) => t.termsType === "PRIVACY_POLICY") ||
          list.find((t) => /개인정보/.test(t.title));

        const foundTos =
          list.find(
            (t) =>
              t.termsType === "TERMS_OF_SERVICE" ||
              t.termsType === "SERVICE_TERMS" ||
              t.termsType === "TERMS"
          ) ||
          list.find((t) => /이용약관/.test(t.title)) ||
          list.find((t) => t !== foundPrivacy);

        setPrivacy(foundPrivacy ?? null);
        setTos(foundTos ?? null);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.response?.data?.message ||
            "약관을 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-white">
      {/* 좌측 이미지 */}
      <img
        src={onboarding_image}
        className="hidden lg:block w-1/2 h-full object-fill"
        alt="signup visual"
      />

      {/* 상단: 뒤로가기 */}
      <button
        onClick={onBack}
        className="w-8 h-8 mt-4 ml-4 flex items-center justify-center rounded-full hover:bg-gray-100"
        aria-label="뒤로가기"
      >
        <FiChevronLeft className="text-2xl" />
      </button>

      {/* 우측 본문 */}
      <div className="w-full lg:w-1/2 h-full scale-[0.8] px-6 sm:px-12 lg:px-[120px] flex flex-col">
        <div className="w-full max-w-[560px] mx-auto flex-1 flex flex-col gap-6">
          {loading && (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              불러오는 중…
            </div>
          )}
          {!loading && error && (
            <div className="flex-1">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* 이용약관 */}
              <section>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 font-pretendard">
                  Troublog 이용약관
                </h3>
                <MarkdownLite
                  markdown={tos?.body || ""}
                  ariaLabel="이용약관 전문"
                  className="h-44 sm:h-54 lg:h-60"
                />
                <label className="mt-2 flex items-center justify-end gap-2 text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-5 h-5 accent-[#9737fd]"
                  />
                  <span className="text-sm md:text-base">동의합니다.</span>
                </label>
              </section>

              {/* 개인정보 처리방침 */}
              <section>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 font-pretendard">
                  Troublog 개인정보 처리방침
                </h3>
                <MarkdownLite
                  markdown={privacy?.body || ""}
                  ariaLabel="개인정보 처리방침 전문"
                  className="h-44 sm:h-54 lg:h-60"
                />
                <label className="mt-2 flex items-center justify-end gap-2 text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="w-5 h-5 accent-[#9737fd]"
                  />
                  <span className="text-sm md:text-base">동의합니다.</span>
                </label>

                <label className="mt-4 flex items-center justify-end gap-2 text-gray-800 select-none">
                  <input
                    type="checkbox"
                    checked={agreeAll}
                    onChange={(e) => onToggleAll(e.target.checked)}
                    className="w-5 h-5 accent-[#9737fd]"
                  />
                  <span className="text-sm md:text-base font-medium">
                    모두 동의합니다.
                  </span>
                </label>
              </section>

              {/* 하단 확인 버튼: 두 약관 모두 동의해야 활성화 */}
              <div className="mt-auto pt-2">
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!allAgreed}
                  className="w-full h-12 rounded-lg flex items-center justify-center
                             bg-[#9737fd] text-white text-base sm:text-lg font-semibold
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  확인
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
