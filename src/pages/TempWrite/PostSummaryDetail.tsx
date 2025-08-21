import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import HeaderWoSearch from "@/components/Header/HeaderWoSearch";
import TagList from "@/components/Card/TagList";
import PostGuideMd from "@/components/Community/PostGuideMd";
import { getPostSummary } from "@/api/post.api";
import type { GetSummaryResponse } from "@/models/post.model";

type GuideContent = string | { type: "image"; src: string; alt?: string };

const HEADER_OFFSET = 500;

export default function PostSummaryDetail() {
  const { summaryId } = useParams<{ summaryId: string }>();

  const [data, setData] = useState<GetSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!summaryId) throw new Error("잘못된 요약 ID");
        setLoading(true);
        const res = await getPostSummary(Number(summaryId));
        if (!cancelled) setData(res);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "요약본을 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [summaryId]);

  const questions = useMemo<string[]>(
    () => (data?.summaryContents ?? []).map((c) => c.subTitle),
    [data]
  );

  const contents = useMemo<GuideContent[][]>(
    () => (data?.summaryContents ?? []).map((c) => [c.body]),
    [data]
  );

  const [currentSection, setCurrentSection] = useState<number>(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    sectionRefs.current = questions.map((_, idx) =>
      document.getElementById(`section-${idx}`)
    );
  }, [questions]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      let cur = 0;
      sectionRefs.current.forEach((ref, idx) => {
        if (!ref) return;
        const top = ref.getBoundingClientRect().top + window.scrollY;
        if (y >= top - 250) cur = idx;
      });
      setCurrentSection(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (idx: number) => {
    const t = sectionRefs.current[idx];
    if (t) {
      window.scrollTo({ top: t.offsetTop - HEADER_OFFSET, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div>
        <HeaderWoSearch />
        <div className="w-full px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-[1200px] flex items-start justify-center gap-6">
            <main className="flex-1 w-full max-w-[900px] pt-[180px]">
              <div className="h-[120px] bg-gray-100 rounded mb-6" />
              <div className="h-[400px] bg-gray-100 rounded" />
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div>
        <HeaderWoSearch />
        <div className="w-full px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-[1200px] pt-[180px] text-red-600">
            {err ?? "요약본을 찾을 수 없습니다."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeaderWoSearch />

      <div className="w-full px-4 sm:px-6 md:px-8">
        {/* 본문 + TOC 행 배치, 가운데 정렬 */}
        <div className="mx-auto flex items-start justify-center gap-10 pl-16">
          {/* 본문 컬럼 */}
          <main className="flex-1 w-full max-w-[900px] flex flex-col items-start gap-8 sm:gap-[56px] mb-24 sm:mb-[224px]">
            {/* 상단 영역 */}
            <section className="w-full pt-20 sm:pt-[120px] pb-[18px] border-b border-gray1">
              <div className="flex flex-col items-start gap-8 sm:gap-[44px] w-full">
                <div className="flex flex-col items-start gap-8 sm:gap-[53px] w-full">
                  <div className="flex flex-col items-start gap-[10px] w-full">
                    <div className="flex w-full justify-between items-start">
                      <span className="text-head-20-semibold">
                        {data.errorTag}
                      </span>
                    </div>
                    <h1 className="text-head-48 break-words">{data.title}</h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-[12px] sm:gap-[16px]">
                    <TagList tags={data.postTags ?? []} variant="post" />
                    <div className="text-body-16-regular text-gray3">·</div>
                    <time className="text-body-20-regular text-gray3">
                      {new Date(data.summaryCreatedAt).toLocaleDateString()}
                    </time>
                  </div>
                </div>
              </div>
            </section>

            {/* 섹션들 */}
            <section className="flex w-full flex-col items-start gap-[8px]">
              <div className="flex flex-col items-start gap-[36px] self-stretch">
                <div className="flex flex-col items-start self-stretch">
                  <div className="flex flex-col items-start gap-[48px] self-stretch">
                    {questions.map((q, idx) => (
                      <div
                        id={`section-${idx}`}
                        key={idx}
                        className="scroll-mt-28 md:scroll-mt-[200px]"
                      >
                        <PostGuideMd
                          question={q}
                          content={contents[idx] ?? []}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </main>

          {/* TOC 사이드: xl 이상에서만 보이고 sticky */}
          {questions.length > 0 && (
            <aside
              className="hidden xl:block h-fit w-[260px] 2xl:w-[320px] sticky self-start flex-shrink-0"
              style={{ top: HEADER_OFFSET }}
            >
              <nav className="flex flex-col items-start gap-[16px] border-l border-gray3 pl-[12px] pr-[8px] py-[8px] rounded-lg bg-white/70 backdrop-blur-sm text-body-20-regular text-gray3 w-full">
                {questions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToSection(idx)}
                    className={`block w-full text-left hover:text-black ${
                      currentSection === idx ? "text-black" : ""
                    }`}
                    aria-current={currentSection === idx ? "true" : undefined}
                  >
                    {idx + 1}. {q}
                  </button>
                ))}
              </nav>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
