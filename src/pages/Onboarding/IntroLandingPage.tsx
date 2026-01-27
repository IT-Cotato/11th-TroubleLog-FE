import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATH } from "@/shared/config/paths";
import HeaderLogoOnly from "@/layouts/Header/HeaderLogoOnly";
import { FiChevronDown } from "react-icons/fi";
import { AnswerBlock, FAQSection } from "@/shared/ui/GEO";

import logo from "@/assets/icons/logo.svg";
import HeroMock from "@/assets/images/intro/hero_mock.png";
import GuideComposite from "@/assets/images/intro/guide_composite.png";

// 샘플 문서 이미지(탭과 매핑)
import SampleDocResume from "@/assets/images/intro/sample_doc_resume.png";
import SampleDocInterview from "@/assets/images/intro/sample_doc_interview.png";
import SampleDocBlog from "@/assets/images/intro/sample_doc_blog.png";
import SampleDocIssue from "@/assets/images/intro/sample_doc_issue.png";

import LaptopSide from "@/assets/images/intro/laptop_side.png";
import Footer from "@/layouts/Footer/Footer";

type TabKey = "resume" | "interview" | "memoirs" | "issue";

const TABS: { key: TabKey; title: string; desc: string }[] = [
  { key: "resume", title: "자기소개서", desc: "직무 역량 중심으로" },
  { key: "interview", title: "면접대비", desc: "경험 기반 질문과 답변" },
  { key: "memoirs", title: "회고록", desc: "개발 맥락과 배운 점을 담아" },
  { key: "issue", title: "Issue 관리", desc: "문제 원인과 해결 방법" },
];

const SAMPLE_BY_TAB: Record<TabKey, string> = {
  resume: SampleDocResume,
  interview: SampleDocInterview,
  memoirs: SampleDocBlog,
  issue: SampleDocIssue,
};

export default function IntroLandingPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const [ready, setReady] = useState(false);

  // 로그인 토큰 보유 시 홈/next로 우회
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const next = new URLSearchParams(loc.search).get("next");
      const isInternal = next && next.startsWith("/") && !next.startsWith("//");
      nav(isInternal ? next : PATH.HOME, { replace: true });
      return;
    }
    setReady(true);
  }, [nav, loc.search]);

  // “바로 아래 섹션” 스크롤 타깃
  const nextSectionRef = useRef<HTMLDivElement | null>(null);
  const scrollToNextSection = useCallback(() => {
    if (!nextSectionRef.current) return;
    const header = document.querySelector("header");
    const headerH = header ? (header as HTMLElement).offsetHeight : 0;
    const y =
      window.scrollY +
      nextSectionRef.current.getBoundingClientRect().top -
      (headerH + 8);
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabKey>("resume");

  if (!ready) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderLogoOnly />

      <main className="flex-1">
        {/* ================== 1) HERO: 배경 이미지 + 중앙 카피 ================== */}
        <section
          className="relative w-full"
          style={{
            backgroundImage: `url(${HeroMock})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* 대비를 위한 옅은 오버레이 */}
          <div aria-hidden />
          <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 py-20 sm:py-24 lg:py-32">
            <div className="max-w-3xl mx-auto text-center">
              <img src={logo} alt="로고" className="w-36 h-24 mx-auto pb-8" />
              <p className="text-[#000] text-center text-6xl font-extrabold font-sans leading-[normal] whitespace-pre-line">
                {`TrouBlog에 오신 걸
                환영합니다!`}
              </p>
              <p className="mt-5 text-var(--Gray4, #525252) text-center text-xl font-medium leading-[normal] whitespace-pre-line">
                {`개발자의 문제 해결 기록이 성장으로 이어지는 곳
                버그, 이슈, 막막했던 순간들...
                그저 넘겼던 문제 해결 과정을 이제는 구조적으로 기록하고,
                이력서, 면접, 회고록, 이슈관리에 바로 활용할 수 있는 요약본까지 자동 생성해드립니다.`}
              </p>

              {/* GEO: Answer Block */}
              <div className="mt-8 max-w-4xl mx-auto">
                <AnswerBlock
                  title="TrouBlog란?"
                  summary="TrouBlog는 개발자가 트러블슈팅 경험을 체계적으로 기록하고, 이를 다양한 형식(이력서, 면접 준비, 회고록, 이슈 관리)으로 자동 요약해주는 플랫폼입니다. 문제 해결 과정을 단순히 기록하는 것을 넘어, 성장으로 이어지는 가치 있는 문서로 변환합니다."
                  keyPoints={[
                    "트러블슈팅 경험을 구조적으로 기록",
                    "가이드 템플릿과 자유 템플릿으로 다양한 형식 지원",
                    "이력서, 면접, 회고록, 이슈 관리용 자동 요약 생성",
                    "커뮤니티를 통한 지식 공유 및 학습",
                    "프로젝트별 트러블슈팅 관리 및 통계 제공",
                  ]}
                  lastUpdatedISO={new Date().toISOString()}
                  author={{
                    name: "TrouBlog Team",
                    organization: "TrouBlog",
                  }}
                  sources={[
                    {
                      label: "커뮤니티 둘러보기",
                      href: `${window.location.origin}/user/community`,
                    },
                    {
                      label: "로그인",
                      href: `${window.location.origin}/login`,
                    },
                  ]}
                />
              </div>

              {/* 스크롤 버튼 (아랫단으로만 이동) */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={scrollToNextSection}
                  className={[
                    "inline-flex h-14 w-14 items-center justify-center rounded-full",
                    "border border-[#D7C6FF] bg-white shadow-[0_8px_20px_rgba(155,93,224,0.15)]",
                    "hover:bg-[#FBF8FF] active:scale-95 transition",
                  ].join(" ")}
                  aria-label="아래 섹션으로 이동"
                  title="아래로 스크롤"
                >
                  <FiChevronDown className="text-2xl text-primary" />
                </button>
                <p className="mt-3 text-body-14-regular text-gray-600">
                  트러블로그 소개 더 보기
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================== 2) GUIDE ================== */}
        <section ref={nextSectionRef}>
          <div className="flex-row mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 py-20 sm:py-24 lg:py-32 justify-center items-center">
            <div className="order-2 lg:order-1">
              <div className="order-1 lg:order-2 text-left space-y-5 sm:space-y-6 lg:pl-16 xl:pl-24">
                <p className="pb-8 pr-20 text-center text-head-48">
                  쉽고 명확하게 작성해 보세요!
                </p>
              </div>

              <img
                src={GuideComposite}
                alt="작성 가이드/체크리스트"
                className="w-[55rem] mx-auto"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* ================== 3) FORMATS: 탭 버튼 + 매핑 샘플 ================== */}
        <section className="py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 py-20 sm:py-24 lg:py-32">
            <h3 className="text-center text-head-48">
              트러블로그를 통해 문제 해결 경험을 원하는 형식으로 정리해보세요!
            </h3>

            {/* 탭 버튼들 */}
            <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4">
              {TABS.map(({ key, title, desc }) => {
                const active = key === activeTab;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={[
                      "justify-between w-60 h-28 pl-5 rounded-xl transition",
                      "text-left",
                      active
                        ? "bg-white border border-[#B8B8B8]"
                        : "bg-[#EFEFEF]",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    <div className="text-head-20-semibold pb-1">{title}</div>
                    <div className="text-body-16-regular">{desc}</div>
                  </button>
                );
              })}
            </div>

            {/* 샘플 문서 프리뷰 (탭에 따라 이미지 교체) */}
            <div className="mt-8 sm:mt-10">
              <img
                src={SAMPLE_BY_TAB[activeTab]}
                alt={`${TABS.find((t) => t.key === activeTab)?.title} 샘플`}
                className="w-[65rem] mx-auto"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* ================== 4) CTA ================== */}
        <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-screen-2xl px-6 sm:px-8 md:px-12 grid lg:grid-cols-2 items-center">
            <div className="space-y-6 sm:space-y-7 pl-40">
              <p className="text-[#000] text-left text-6xl font-extrabold font-sans leading-[normal]">
                지금 시작해보세요!
              </p>
              <p className="mt-5 text-var(--Gray4, #525252) text-left text-xl font-medium leading-[normal] whitespace-pre-line">
                {`버튼을 눌러 첫 기록을 남겨보세요.
                기록을 시작하면, 원하시는 형식으로 정리해드려요.`}
              </p>
              <button
                onClick={() => nav(PATH.LOGIN)}
                className="inline-flex h-12 items-center rounded-xl bg-primary px-6 text-white text-body-20-regular hover:opacity-90 transition"
              >
                트러블로그 작성하러 가기
              </button>
            </div>

            <img
              src={LaptopSide}
              alt="노트북 목업"
              className="w-30 h-auto pb-20"
              loading="lazy"
            />
          </div>
        </section>

        {/* ================== 5) GEO: FAQ Section ================== */}
        <section className="py-16 sm:py-20 lg:py-28 bg-gray-50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
            <FAQSection
              title="TrouBlog에 대해 자주 묻는 질문"
              items={[
                {
                  question: "TrouBlog는 무엇인가요?",
                  answer:
                    "TrouBlog는 개발자가 트러블슈팅 경험을 체계적으로 기록하고, 이를 다양한 형식으로 자동 요약해주는 플랫폼입니다. 문제 해결 과정을 기록하여 이력서, 면접 준비, 회고록, 이슈 관리 등에 바로 활용할 수 있습니다.",
                },
                {
                  question: "어떤 형식으로 기록할 수 있나요?",
                  answer:
                    "가이드 템플릿과 자유 템플릿 두 가지 형식을 제공합니다. 가이드 템플릿은 체크리스트와 질문-답변 형식으로 구조화된 기록을, 자유 템플릿은 자유로운 형식의 글 작성을 지원합니다.",
                },
                {
                  question: "자동 요약 기능은 어떻게 작동하나요?",
                  answer:
                    "기록한 트러블슈팅을 기반으로 이력서용, 면접 준비용, 회고록용, 이슈 관리용 등 다양한 형식의 요약본을 자동으로 생성해드립니다. 각 형식에 맞는 핵심 내용을 추출하여 정리합니다.",
                },
                {
                  question: "기록한 내용을 공유할 수 있나요?",
                  answer:
                    "네, 커뮤니티 기능을 통해 다른 개발자들과 트러블슈팅 경험을 공유할 수 있습니다. 공개 설정을 통해 원하는 포스트만 공유할 수 있으며, 좋아요와 댓글 기능으로 소통할 수 있습니다.",
                },
                {
                  question: "프로젝트별로 관리할 수 있나요?",
                  answer:
                    "프로젝트 폴더를 생성하여 관련된 트러블슈팅을 그룹화하여 관리할 수 있습니다. 프로젝트별 통계와 필터링 기능을 제공하여 효율적으로 관리할 수 있습니다.",
                },
              ]}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
