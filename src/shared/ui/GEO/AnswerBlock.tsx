/**
 * GEO 최적화: Answer Block 컴포넌트
 *
 * 생성형 AI 검색에서 인용 가능한 요약/정의 블록을 제공합니다.
 * 페이지 상단에 배치하여 AI가 답변을 생성할 때 참조할 수 있도록 합니다.
 */

export interface AnswerBlockProps {
  /** 주제/제목 */
  title: string;
  /** 2~3문장 요약 (정의) */
  summary: string;
  /** 핵심 포인트 3~5개 */
  keyPoints: string[];
  /** 마지막 업데이트 날짜 (ISO 8601 형식) */
  lastUpdatedISO: string;
  /** 근거/참고 링크 */
  sources?: Array<{ label: string; href: string }>;
  /** 작성 주체 (조직/팀/작성자) */
  author?: {
    name: string;
    organization?: string;
  };
}

export default function AnswerBlock({
  title,
  summary,
  keyPoints,
  lastUpdatedISO,
  sources = [],
  author,
}: AnswerBlockProps) {
  // ISO 날짜를 한국어 형식으로 변환
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <section
      aria-label="요약 답변"
      className="w-full rounded-2xl border border-gray-200 bg-gradient-to-br from-purple-50/50 to-white p-6 sm:p-8 shadow-sm"
    >
      {/* Eyebrow */}
      <p className="text-sm font-semibold text-purple-600 mb-3">요약</p>

      {/* 제목 */}
      <h2 className="text-head-24-bold sm:text-head-32-semibold mb-4 text-gray-900">
        {title}
      </h2>

      {/* 요약 문단 */}
      <p className="text-body-16-regular sm:text-body-20-regular text-gray-700 mb-6 leading-relaxed">
        {summary}
      </p>

      {/* 핵심 포인트 */}
      {keyPoints.length > 0 && (
        <ul className="space-y-2 mb-6">
          {keyPoints.map((point, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-body-14-regular sm:text-body-16-regular text-gray-700"
            >
              <span className="text-purple-600 mt-1.5 flex-shrink-0">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      {/* 메타 정보 (업데이트 날짜, 작성자) */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 text-body-14-regular text-gray-500">
        <div className="flex items-center gap-2">
          <span>마지막 업데이트:</span>
          <time dateTime={lastUpdatedISO} className="font-medium">
            {formatDate(lastUpdatedISO)}
          </time>
        </div>
        {author && (
          <div className="flex items-center gap-2">
            <span>작성:</span>
            <span className="font-medium">
              {author.name}
              {author.organization && ` (${author.organization})`}
            </span>
          </div>
        )}
      </div>

      {/* 근거/참고 링크 */}
      {sources.length > 0 && (
        <nav
          aria-label="근거 및 참고 자료"
          className="mt-6 pt-6 border-t border-gray-200"
        >
          <h3 className="text-body-16-semibold mb-3 text-gray-900">
            근거/참고
          </h3>
          <ul className="space-y-2">
            {sources.map((source, idx) => (
              <li key={idx}>
                <a
                  href={source.href}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="text-body-14-regular text-purple-600 hover:text-purple-700 hover:underline inline-flex items-center gap-1"
                >
                  {source.label}
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}
