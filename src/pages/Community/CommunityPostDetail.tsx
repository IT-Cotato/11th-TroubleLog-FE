import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import TagList from "@/components/Card/TagList";
import PostGuideMd from "@/components/Community/PostGuideMd";
import { getPostSummary } from "@/api/post.api";
import type { GetSummaryResponse } from "@/models/post.model";
import HeaderWoSearch from "@/components/Header/HeaderWoSearch";

export default function PostSummaryDetail() {
  const { summaryId } = useParams<{ summaryId: string }>();

  const [data, setData] = useState<GetSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // 섹션 refs/현재 섹션
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [currentSection, setCurrentSection] = useState(0);

  // 데이터 로드
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

  // 스크롤 추적
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      let cur = 0;
      sectionRefs.current.forEach((ref, idx) => {
        if (!ref) return;
        const top = ref.getBoundingClientRect().top + window.scrollY;
        if (y >= top - 250) cur = idx; // 헤더 보정치
      });
      setCurrentSection(cur);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // TOC 클릭 시 스크롤
  const scrollToSection = (idx: number) => {
    const target = sectionRefs.current[idx];
    if (target) {
      window.scrollTo({ top: target.offsetTop - 180, behavior: "smooth" });
    }
  };

  // 렌더용 파생값
  const questions = useMemo(
    () => (data?.summaryContents ?? []).map((c) => c.subTitle),
    [data]
  );
  const contents = useMemo(
    () => (data?.summaryContents ?? []).map((c) => [c.body]),
    [data]
  );

  // 로딩/에러
  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="flex flex-col items-start max-w-[1200px] ml-[360px] mr-[36px] gap-[24px] w-full pt-[180px]">
          <div className="w-full h-[120px] bg-gray-100 rounded" />
          <div className="w-full h-[400px] bg-gray-100 rounded" />
        </div>
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[1200px] w-full pt-[180px] text-red-600">
          {err ?? "요약본을 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <HeaderWoSearch />

      {/* 본문 + 우측 목차를 가로로 배치 */}
      <div className="flex justify-center">
        {/* 본문 */}
        <div className="flex flex-col items-start max-w-[1200px] ml-[360px] mr-[36px] gap-[56px] mb-[224px]">
          {/* 상단 */}
          <div className="flex w-full pt-[180px] pb-[18px] items-center border-b border-gray1">
            <div className="flex flex-col items-start gap-[44px]">
              <div className="flex flex-col items-start gap-[53px]">
                <div className="flex flex-col items-start gap-[10px]">
                  <div className="flex w-[1200px] justify-between items-start">
                    <span className="text-head-20-semibold">
                      {data.errorTag}
                    </span>
                  </div>
                  <div className="text-head-48">{data.title}</div>
                </div>

                <div className="flex items-center gap-[16px]">
                  <TagList tags={data.postTags ?? []} variant="post" />
                  <div className="text-body-16-regular text-gray3">·</div>
                  <div className="text-body-20-regular text-gray3">
                    {new Date(data.summaryCreatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 섹션들 */}
          <div className="flex w-full flex-col items-start gap-[8px]">
            <div className="flex flex-col items-start gap-[36px] self-stretch">
              <div className="flex flex-col items-start self-stretch">
                <div className="flex flex-col items-start gap-[48px] self-stretch">
                  {(questions ?? []).map((q, idx) => (
                    <div
                      id={`section-${idx}`}
                      key={idx}
                      ref={(el) => {
                        sectionRefs.current[idx] = el;
                      }}
                      className="scroll-mt-[200px]"
                    >
                      <PostGuideMd question={q} content={contents[idx] ?? []} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 목차 */}
        <aside className="inline-flex items-start mt-[588px] mr-[89px] sticky top-[588px] h-fit">
          <nav className="flex flex-col items-start gap-[16px] border-l border-gray3 p-[12px] text-body-20-regular text-gray3">
            {(questions ?? []).map((q, idx) => (
              <button
                key={idx}
                onClick={() => scrollToSection(idx)}
                className={`text-left ${
                  currentSection === idx ? "text-black" : ""
                }`}
              >
                {idx + 1}. {q}
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
