import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATH } from "@/shared/config/paths";
import HeaderLogoOnly from "@/layouts/Header/HeaderLogoOnly";
import HeroLaptop from "@/assets/images/hero-laptop.png";
import GuideShot from "@/assets/images/guide-shot.png";
import GuideChecklist from "@/assets/images/guide-checklist.png";
import Slide1 from "@/assets/images/slide1.png";
import Slide2 from "@/assets/images/slide2.png";
import Slide3 from "@/assets/images/slide3.png";
import Slide4 from "@/assets/images/slide4.png";

type Slide = { img: string; alt: string };

const slides: Slide[] = [
  { img: Slide1, alt: "자기소개서 템플릿" },
  { img: Slide2, alt: "면접 대비 템플릿" },
  { img: Slide3, alt: "블로그 템플릿" },
  { img: Slide4, alt: "이슈 관리 템플릿" },
];

export default function IntroLandingPage() {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goLogin = () => nav(PATH.LOGIN);
  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx((i) => (i + 1) % slides.length);

  // 자동 슬라이드
  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, []);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 선택된 카드(i)를 뷰포트 "가운데"로 정확히 스크롤 (패딩/갭/뷰폭 무관)
  const centerActive = useCallback((i: number) => {
    const vp = viewportRef.current;
    const el = itemRefs.current[i];
    if (!vp || !el) return;

    const vpRect = vp.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const nextLeft =
      vp.scrollLeft +
      (elRect.left + elRect.width / 2) -
      (vpRect.left + vpRect.width / 2);

    vp.scrollTo({ left: nextLeft, behavior: "smooth" });
  }, []);

  // idx 바뀔 때마다 중앙 정렬
  useEffect(() => {
    centerActive(idx);
  }, [idx, centerActive]);

  // 초기 마운트/리사이즈에도 중앙 유지
  useEffect(() => {
    const onResize = () => centerActive(idx);
    window.addEventListener("resize", onResize);
    // 초기 1회 보정 (이미지 로딩 등 레이아웃 안정 후)
    const t = setTimeout(() => centerActive(idx), 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [idx, centerActive]);

  const SWIPE_THRESHOLD = 40;
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx > 0) {
        prev();
      } else {
        next();
      }
    }
    touchStartX.current = null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderLogoOnly />

      <main className="flex-1">
        {/* HERO (배경: 흰색) */}
        <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 py-16 sm:py-20 lg:py-28 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 sm:space-y-8 md:space-y-10">
            <h1 className="text-head-48">Troublog에 오신 걸 환영합니다!</h1>
            <p className="text-body-20-regular text-gray-600 whitespace-pre-line leading-relaxed sm:leading-8">
              {`개발자의 문제 해결 기록이 성장으로 이어지는 곳
버그, 이슈, 막막했던 순간들...
그저 넘겼던 문제 해결 과정을 이제는 구조적으로 기록하고,
이력서, 면접, 블로그, 이슈관리에 바로 활용할 수 있는 요약본까지 자동 생성해드립니다.`}
            </p>
            <button
              onClick={goLogin}
              className="inline-flex h-12 items-center rounded-xl bg-primary px-6 text-white text-body-16-semibold hover:opacity-90 transition"
            >
              시작하기
            </button>
          </div>
          <div className="w-full">
            <img
              src={HeroLaptop}
              alt="Troublog 화면 예시"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        </section>

        <div className="bg-gradient-to-b from-white via-[#F4ECFF] to-[#E6D4FF]">
          {/* 작성 가이드 섹션 */}
          <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 py-16 sm:py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative">
              <img
                src={GuideShot}
                alt="작성 가이드 화면"
                className="w-full h-auto"
                loading="lazy"
              />
              <img
                src={GuideChecklist}
                alt="가이드 체크리스트"
                loading="lazy"
                aria-hidden
                className="pointer-events-none absolute -top-4 right-2 sm:-top-8 sm:right-4 md:-top-10 md:right-8 lg:-top-12 lg:right-10 w-32 sm:w-44 md:w-56 lg:w-64 rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-white/80"
              />
            </div>

            <div className="order-1 lg:order-2 text-left space-y-5 sm:space-y-6 lg:pl-16 xl:pl-24 2xl:pl-32">
              <h2 className="text-head-32-bold text-primary whitespace-pre-line leading-relaxed sm:leading-9">
                {`쉽고 
명확하게
작성해 보세요!`}
              </h2>
              <p className="text-body-20-regular text-gray-600 whitespace-pre-line leading-relaxed sm:leading-8">
                {`트러블로그가 트러블슈팅 해결을 위한
가이드를 제공해드려요!`}
              </p>
            </div>
          </section>

          {/* 캐러셀: 화면 전체 너비 차지 + 중앙 포커싱 */}
          <section className="py-16 sm:py-20 lg:py-28">
            {/* 🟣 Full-bleed 래퍼: 부모의 좌우 패딩/최대폭을 무시하고 화면 전체 차지 */}
            <div className="relative left-1/2 -translate-x-1/2 w-screen">
              <h3 className="text-center text-head-32-bold mb-10 sm:mb-12 px-4">
                트러블로그가 문제 해결 경험을 원하는 형식으로 정리해드려요!
              </h3>

              {/* 뷰포트: 화면 전체 너비 */}
              <div
                ref={viewportRef}
                className="w-screen overflow-x-auto snap-x snap-mandatory scroll-smooth select-none
                           px-4 sm:px-6 md:px-8"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {/* 트랙 */}
                <div className="flex items-stretch gap-8 sm:gap-10 md:gap-12 lg:gap-14">
                  {slides.map((s, i) => {
                    const active = i === idx;
                    return (
                      <div
                        key={i}
                        ref={(el) => {
                          itemRefs.current[i] = el;
                        }}
                        className="snap-center relative
                                   w-[62vw] xs:w-[50vw] sm:w-60 md:w-72 lg:w-80 xl:w-96
                                   aspect-square overflow-hidden rounded-2xl flex-shrink-0
                                   bg-white border border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                        aria-hidden={!active}
                        onClick={() => setIdx(i)} // 클릭 시 해당 슬라이드로 포커싱
                      >
                        <img
                          src={s.img}
                          alt={s.alt}
                          className={[
                            "absolute inset-0 w-full h-full object-cover",
                            "transition-all duration-300 ease-out",
                            active
                              ? "opacity-100 scale-100"
                              : "opacity-80 scale-[0.96] blur-[2px]",
                          ].join(" ")}
                          loading="lazy"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 인디케이터 */}
              <div className="mt-6 sm:mt-8 flex justify-center gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`${i + 1}번째 슬라이드로 이동`}
                    onClick={() => setIdx(i)}
                    className={`h-2 rounded-full transition-all ${
                      idx === i ? "w-6 bg-primary" : "w-2 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* 마지막 CTA */}
          <section className="py-20 sm:py-24 lg:py-28">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 md:px-8 text-center space-y-6 sm:space-y-8">
              <h3 className="text-head-32-bold">지금 시작해보세요!</h3>
              <button
                onClick={goLogin}
                className="inline-flex h-12 items-center rounded-xl bg-primary px-6 text-white text-body-16-semibold hover:opacity-90 transition"
              >
                트러블슈팅 작성하러 가기
              </button>
              <p className="text-body-14-regular text-gray-600 whitespace-pre-line leading-relaxed sm:leading-7">
                {`버튼을 눌러 첫 기록을 남겨보세요.
기록을 시작하면, 원하시는 형식으로 정리해드려요.`}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
