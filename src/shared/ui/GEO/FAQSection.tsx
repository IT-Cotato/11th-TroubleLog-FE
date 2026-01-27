/**
 * GEO 최적화: FAQ Section 컴포넌트
 *
 * 질문형 쿼리에 대응하기 위한 FAQ 섹션과 JSON-LD 구조화 데이터를 제공합니다.
 * Google의 FAQPage 스키마를 따릅니다.
 */

import { useEffect } from "react";

export interface FAQItem {
  /** 질문 */
  question: string;
  /** 답변 */
  answer: string;
}

export interface FAQSectionProps {
  /** FAQ 제목 (기본값: "자주 묻는 질문") */
  title?: string;
  /** FAQ 항목 목록 */
  items: FAQItem[];
  /** 섹션 ID (접근성용) */
  id?: string;
}

export default function FAQSection({
  title = "자주 묻는 질문",
  items,
  id = "faq-section",
}: FAQSectionProps) {
  // JSON-LD 스키마 생성
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  // JSON-LD 스크립트 삽입
  useEffect(() => {
    const scriptId = `faq-schema-${id}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(faqSchema, null, 2);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [items, id]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      id={id}
      aria-label={title}
      className="w-full mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-gray-200"
    >
      <h2 className="text-head-32-semibold mb-6 sm:mb-8 text-gray-900">
        {title}
      </h2>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <details
            key={idx}
            className="group rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h3 className="text-body-18-semibold sm:text-head-20-semibold text-gray-900 pr-4 flex-1">
                {item.question}
              </h3>
              <svg
                className="w-5 h-5 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-body-16-regular text-gray-700 leading-relaxed whitespace-pre-line">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
