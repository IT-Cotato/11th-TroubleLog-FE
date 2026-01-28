/**
 * GEO 최적화: JSON-LD 스키마 생성 유틸리티
 *
 * 다양한 구조화 데이터 스키마를 생성하는 헬퍼 함수들
 */

/**
 * Article 스키마 생성 (블로그 포스트/기사용)
 */
export interface ArticleSchemaProps {
  headline: string;
  description: string;
  author: {
    name: string;
    url?: string;
  };
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
  publisher?: {
    name: string;
    logo?: {
      url: string;
      width?: number;
      height?: number;
    };
  };
}

export function createArticleSchema({
  headline,
  description,
  author,
  datePublished,
  dateModified,
  image,
  url,
  publisher,
}: ArticleSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    author: {
      "@type": "Person",
      name: author.name,
      ...(author.url && { url: author.url }),
    },
    datePublished,
    ...(dateModified && { dateModified }),
    ...(image && { image }),
    url,
    ...(publisher && {
      publisher: {
        "@type": "Organization",
        name: publisher.name,
        ...(publisher.logo && {
          logo: {
            "@type": "ImageObject",
            url: publisher.logo.url,
            ...(publisher.logo.width && { width: publisher.logo.width }),
            ...(publisher.logo.height && { height: publisher.logo.height }),
          },
        }),
      },
    }),
  };
}

/**
 * FAQPage 스키마 생성
 */
export interface FAQSchemaProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export function createFAQSchema({ questions }: FAQSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

/**
 * HowTo 스키마 생성 (단계별 가이드용)
 */
export interface HowToSchemaProps {
  name: string;
  description: string;
  steps: Array<{
    name: string;
    text: string;
    image?: string;
  }>;
}

export function createHowToSchema({
  name,
  description,
  steps,
}: HowToSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((step, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };
}

/**
 * BreadcrumbList 스키마 생성
 */
export interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function createBreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * JSON-LD 스크립트를 DOM에 삽입하는 헬퍼
 */
export function injectJSONLD(
  schema: object,
  id: string = `json-ld-${Date.now()}`,
): () => void {
  const scriptId = `json-ld-${id}`;
  let script = document.getElementById(scriptId) as HTMLScriptElement;

  if (!script) {
    script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(schema, null, 2);

  // cleanup 함수 반환
  return () => {
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }
  };
}
