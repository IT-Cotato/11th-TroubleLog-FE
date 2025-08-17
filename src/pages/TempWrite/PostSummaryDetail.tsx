import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import TagList from "@/components/Card/TagList";
import PostGuideMd from "@/components/Community/PostGuideMd";
import { getPostSummary } from "@/api/post.api";
import type { GetSummaryResponse, SummaryTypeParam } from "@/models/post.model";
// import { PATH } from "@/constants/paths";

export default function PostSummaryDetail() {
  const { postId } = useParams<{ postId: string }>();
  const [sp] = useSearchParams();
  const type = (sp.get("type") ?? "RESUME") as SummaryTypeParam;

  const [data, setData] = useState<GetSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!postId) throw new Error("잘못된 포스트 ID");
        setLoading(true);
        const res = await getPostSummary(Number(postId), { type });
        if (cancelled) return;
        setData(res);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "요약본을 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, type]);

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
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const questions: string[] = useMemo(
    () => (data?.contents ?? []).map((c) => c.subTitle),
    [data]
  );
  const contents: string[][] = useMemo(
    () => (data?.contents ?? []).map((c) => [c.body]),
    [data]
  );
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
    <div className="flex justify-center">
      {/* 본문 */}
      <div className="flex flex-col items-start max-w-[1200px] ml-[360px] mr-[36px] gap-[56px] mb-[224px]">
        {/* 상단 */}
        <div className="flex w-full pt-[180px] pb-[18px] items-center border-b border-gray1">
          <div className="flex flex-col items-start gap-[44px]">
            <div className="flex flex-col items-start gap-[53px]">
              <div className="flex flex-col items-start gap-[10px]">
                <div className="flex w-[1200px] justify-between items-start">
                  <span className="text-head-20-semibold">{data.errorTag}</span>
                </div>
                <div className="text-head-48">{data.title}</div>
              </div>

              <div className="flex items-center gap-[16px]">
                <TagList tags={data.postTags ?? []} variant="post" />
                <div className="text-body-16-regular text-gray3">·</div>
                <div className="text-body-20-regular text-gray3">
                  {new Date(data.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 섹션 */}
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

      {/* 목차 */}
      <div className="inline-flex items-start mt-[588px] mr-[89px] sticky top-[588px] h-fit">
        <div className="flex flex-col items-start gap-[16px] border-l border-gray3 p-[12px] text-body-20-regular text-gray3">
          {(questions ?? []).map((q, idx) => (
            <a
              key={idx}
              href={`#section-${idx}`}
              className={`text-left ${
                currentSection === idx ? "text-black" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                const t = sectionRefs.current[idx];
                if (t)
                  window.scrollTo({
                    top: t.offsetTop - 180,
                    behavior: "smooth",
                  });
              }}
            >
              {idx + 1}. {q}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
