# GEO 최적화 프론트엔드 구현 가이드

## 📋 목차

1. [GEO 최적화 개요](#geo-최적화-개요)
2. [구현한 컴포넌트](#구현한-컴포넌트)
3. [적용 사례](#적용-사례)
4. [코드 구조](#코드-구조)
5. [기대 효과](#기대-효과)

---

## GEO 최적화 개요

### GEO란?

**GEO (Generative Engine Optimization)**는 생성형 AI 검색 엔진(Google AI Overviews, ChatGPT, Perplexity 등)에서 콘텐츠가 답변으로 인용되도록 최적화하는 기법입니다.

### SEO vs GEO

| 구분            | SEO                 | GEO                                  |
| --------------- | ------------------- | ------------------------------------ |
| **목표**        | 검색 결과 상위 노출 | AI 답변에 인용/참조                  |
| **최적화 대상** | 키워드 매칭, 링크   | 구조적 명료성, 인용 가능한 단락      |
| **중요 요소**   | 메타 태그, 백링크   | 텍스트 가용성, 엔티티 명확성, 최신성 |

### GEO의 핵심 원칙

1. **인용 가능한 구조**: 한 페이지가 스스로 완결된 답변 후보가 되어야 함
2. **텍스트 가용성**: 중요한 내용이 텍스트로 제공되어야 함
3. **구조화 데이터**: JSON-LD로 명확한 구조 제공
4. **내부 링크**: 관련 콘텐츠 간 연결 강화

---

## 구현한 컴포넌트

### 1. AnswerBlock 컴포넌트

**목적**: 생성형 AI가 인용하기 쉬운 요약/정의 블록 제공

**위치**: `src/shared/ui/GEO/AnswerBlock.tsx`

**주요 기능**:

- 2~3문장 요약 제공
- 핵심 포인트 3~5개 나열
- 마지막 업데이트 날짜 표시
- 근거/참고 링크 제공
- 작성자 정보 표시

**Props 인터페이스**:

```typescript
interface AnswerBlockProps {
  title: string; // 주제/제목
  summary: string; // 2~3문장 요약
  keyPoints: string[]; // 핵심 포인트 3~5개
  lastUpdatedISO: string; // ISO 8601 형식 날짜
  sources?: Array<{
    // 근거/참고 링크
    label: string;
    href: string;
  }>;
  author?: {
    // 작성 주체
    name: string;
    organization?: string;
  };
}
```

**사용 예시**:

```tsx
<AnswerBlock
  title="React Hooks 최적화"
  summary="React Hooks를 사용한 성능 최적화 방법을 설명합니다. useMemo와 useCallback을 활용하여 불필요한 리렌더링을 방지하고, 컴포넌트 성능을 향상시킬 수 있습니다."
  keyPoints={[
    "useMemo로 계산 비용이 큰 값 메모이제이션",
    "useCallback으로 함수 참조 안정화",
    "React.memo로 컴포넌트 리렌더링 최적화",
  ]}
  lastUpdatedISO="2026-01-26T00:00:00Z"
  author={{ name: "개발자", organization: "TrouBlog" }}
  sources={[{ label: "React 공식 문서", href: "https://react.dev" }]}
/>
```

### 2. FAQSection 컴포넌트

**목적**: 질문형 쿼리에 대응하기 위한 FAQ 섹션 + JSON-LD 구조화 데이터

**위치**: `src/shared/ui/GEO/FAQSection.tsx`

**주요 기능**:

- 질문-답변 형태의 FAQ 제공
- Google FAQPage 스키마 자동 생성
- 접근성을 고려한 `<details>` 요소 사용
- JSON-LD 스크립트 자동 삽입

**Props 인터페이스**:

```typescript
interface FAQSectionProps {
  title?: string; // FAQ 제목 (기본값: "자주 묻는 질문")
  items: FAQItem[]; // FAQ 항목 목록
  id?: string; // 섹션 ID (접근성용)
}

interface FAQItem {
  question: string; // 질문
  answer: string; // 답변
}
```

**생성되는 JSON-LD 스키마**:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "질문 내용",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "답변 내용"
      }
    }
  ]
}
```

**사용 예시**:

```tsx
<FAQSection
  title="자주 묻는 질문"
  items={[
    {
      question: "GEO와 SEO의 차이는 무엇인가요?",
      answer:
        "SEO는 링크/문서 중심 노출 최적화이고, GEO는 생성형 답변에 인용·참조되도록 구조와 근거를 강화하는 접근입니다.",
    },
    {
      question: "SSR이 GEO에 유리한가요?",
      answer:
        "대체로 그렇습니다. 렌더된 HTML에서 중요한 텍스트가 즉시 제공되면 크롤링/인용에 유리합니다.",
    },
  ]}
/>
```

### 3. JSON-LD 스키마 유틸리티

**목적**: 다양한 구조화 데이터 스키마 생성

**위치**: `src/shared/utils/geo-schema.ts`

**제공 함수**:

- `createArticleSchema()`: 블로그 포스트/기사용 Article 스키마
- `createFAQSchema()`: FAQPage 스키마
- `createHowToSchema()`: 단계별 가이드용 HowTo 스키마
- `createBreadcrumbSchema()`: BreadcrumbList 스키마
- `injectJSONLD()`: JSON-LD 스크립트를 DOM에 삽입

---

## 적용 사례

### 1. CommunityPostDetail 페이지

**적용 위치**: 커뮤니티 포스트 상세 페이지

**구현 내용**:

#### AnswerBlock 배치

- **위치**: 포스트 제목 바로 아래
- **데이터 소스**:
  - 제목: `post.title`
  - 요약: 포스트의 첫 번째 질문과 에러 타입 기반 자동 생성
  - 핵심 포인트: `post.questions` 배열 (최대 5개)
  - 업데이트 날짜: `post.completedAt` (ISO 형식)
  - 작성자: `post.authorName`
  - 근거 링크: 태그 기반 커뮤니티 링크

**코드 위치**: `src/pages/Community/CommunityPostDetail.tsx` (라인 1136-1158)

```tsx
{
  post.questions.length > 0 && (
    <div className="w-full mt-6">
      <AnswerBlock
        title={post.title}
        summary={`${post.errorType} 관련 문제를 해결하기 위한 트러블슈팅 가이드입니다. ${post.questions[0] ? `${post.questions[0]}에 대한 해결 방법과 과정을 상세히 기록했습니다.` : "단계별 문제 해결 과정을 제공합니다."}`}
        keyPoints={post.questions
          .slice(0, 5)
          .map((q, idx) => `${idx + 1}. ${q}`)}
        lastUpdatedISO={postCompletedAtISO || new Date().toISOString()}
        author={{
          name: post.authorName,
        }}
        sources={
          post.tags.length > 0
            ? post.tags.slice(0, 3).map((tag) => ({
                label: `${tag} 관련 문서`,
                href: `${window.location.origin}/user/community?tag=${encodeURIComponent(tag)}`,
              }))
            : []
        }
      />
    </div>
  );
}
```

#### FAQSection 배치

- **위치**: 포스트 내용 아래, 작성자 정보 카드 위
- **데이터 소스**:
  - 질문: `post.questions` 배열
  - 답변: 각 질문에 해당하는 `post.contents`에서 텍스트 추출 (이미지 제외, 최대 200자)

**코드 위치**: `src/pages/Community/CommunityPostDetail.tsx` (라인 1207-1233)

```tsx
{
  post.questions.length > 0 && (
    <FAQSection
      title="이 트러블슈팅에 대한 질문"
      items={post.questions.map((question, idx) => {
        const content = post.contents[idx];
        const textContent = Array.isArray(content)
          ? content
              .map((item) => {
                if (typeof item === "string") return item;
                if (typeof item === "object" && item.type === "image") {
                  return "";
                }
                return "";
              })
              .filter(Boolean)
              .join(" ")
          : "";

        const answer =
          textContent.length > 200
            ? `${textContent.slice(0, 200)}...`
            : textContent || "상세 내용은 본문을 참고해주세요.";

        return {
          question: `${question}에 대한 해결 방법은 무엇인가요?`,
          answer: answer,
        };
      })}
    />
  );
}
```

### 2. IntroLandingPage

**적용 위치**: 랜딩 페이지

**구현 내용**:

#### AnswerBlock 배치

- **위치**: Hero 섹션 내부
- **내용**: TrouBlog 서비스 소개 및 핵심 기능 요약

**코드 위치**: `src/pages/Onboarding/IntroLandingPage.tsx` (라인 100-130)

```tsx
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
```

#### FAQSection 배치

- **위치**: 페이지 하단 (CTA 섹션 아래)
- **내용**: TrouBlog 서비스 관련 자주 묻는 질문 5개

**코드 위치**: `src/pages/Onboarding/IntroLandingPage.tsx` (라인 216-252)

```tsx
<section className="py-16 sm:py-20 lg:py-28 bg-gray-50">
  <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
    <FAQSection
      title="TrouBlog에 대해 자주 묻는 질문"
      items={[
        {
          question: "TrouBlog는 무엇인가요?",
          answer:
            "TrouBlog는 개발자가 트러블슈팅 경험을 체계적으로 기록하고, 이를 다양한 형식으로 자동 요약해주는 플랫폼입니다...",
        },
        // ... 추가 질문들
      ]}
    />
  </div>
</section>
```

---

## 코드 구조

### 디렉토리 구조

```
src/
├── shared/
│   ├── ui/
│   │   └── GEO/
│   │       ├── AnswerBlock.tsx      # Answer Block 컴포넌트
│   │       ├── FAQSection.tsx       # FAQ Section 컴포넌트
│   │       └── index.ts             # Export 파일
│   └── utils/
│       └── geo-schema.ts            # JSON-LD 스키마 유틸리티
└── pages/
    ├── Community/
    │   └── CommunityPostDetail.tsx  # 적용 사례 1
    └── Onboarding/
        └── IntroLandingPage.tsx     # 적용 사례 2
```

### 컴포넌트 의존성

```
AnswerBlock
  └── 독립 컴포넌트 (외부 의존성 없음)

FAQSection
  └── React hooks (useEffect)
  └── JSON-LD 스키마 자동 생성

geo-schema.ts
  └── 순수 함수 (유틸리티)
```

---

## 기대 효과

### 1. AI 검색 엔진 최적화

- **Google AI Overviews**: AnswerBlock의 요약이 AI 답변에 인용될 가능성 증가
- **ChatGPT/Perplexity**: 구조화된 FAQ가 질문형 쿼리에서 참조될 가능성 증가

### 2. 검색 결과 개선

- **Rich Snippets**: JSON-LD로 인한 구조화된 검색 결과 표시
- **FAQ Rich Results**: FAQ 섹션이 검색 결과에 FAQ 형태로 노출 가능

### 3. 사용자 경험 향상

- **명확한 정보 구조**: 사용자가 빠르게 핵심 정보 파악 가능
- **접근성 향상**: 시맨틱 HTML과 ARIA 레이블로 접근성 개선

### 4. 측정 가능한 지표

| 지표               | 측정 방법               |
| ------------------ | ----------------------- |
| AI 답변 인용       | 수동 샘플링 / SERP 분석 |
| AI Referrer 세션   | GA4 Source 분석         |
| 체류시간 / 전환율  | GA4 이벤트 추적         |
| 업데이트 반영 속도 | 변경 후 관찰            |

---

## 구현 체크리스트

### 필수 컴포넌트

- ✅ Answer Block (요약 단락)
- ✅ FAQ 섹션 (질문형 문장)
- ✅ 근거 링크(Source)
- ✅ 마지막 업데이트 날짜
- ✅ 작성 주체(조직/팀)

### 기술적 요구사항

- ✅ SSR/SSG로 렌더된 HTML 제공 (React 기반, 클라이언트 사이드 렌더링)
- ✅ 시각 요소(Canvas, SVG) 안에만 정보 숨기지 않기
- ✅ JSON-LD 내용 = 실제 화면 텍스트

---

## 사용 가이드

### AnswerBlock 사용하기

1. **기본 사용**:

```tsx
import { AnswerBlock } from "@/shared/ui/GEO";

<AnswerBlock
  title="제목"
  summary="2~3문장 요약"
  keyPoints={["포인트 1", "포인트 2", "포인트 3"]}
  lastUpdatedISO="2026-01-26T00:00:00Z"
/>;
```

2. **작성자 정보 포함**:

```tsx
<AnswerBlock
  // ... 기본 props
  author={{
    name: "작성자 이름",
    organization: "조직명",
  }}
/>
```

3. **근거 링크 추가**:

```tsx
<AnswerBlock
  // ... 기본 props
  sources={[
    { label: "공식 문서", href: "https://example.com" },
    { label: "관련 가이드", href: "https://example.com/guide" },
  ]}
/>
```

### FAQSection 사용하기

1. **기본 사용**:

```tsx
import { FAQSection } from "@/shared/ui/GEO";

<FAQSection
  items={[
    {
      question: "질문 1",
      answer: "답변 1",
    },
    {
      question: "질문 2",
      answer: "답변 2",
    },
  ]}
/>;
```

2. **커스텀 제목**:

```tsx
<FAQSection
  title="커스텀 FAQ 제목"
  items={[...]}
/>
```

---

## 주의사항

### 1. 콘텐츠 일관성

- **JSON-LD와 실제 텍스트 일치**: FAQSection의 JSON-LD 스키마는 화면에 표시되는 텍스트와 정확히 일치해야 합니다.

### 2. 날짜 형식

- **ISO 8601 준수**: `lastUpdatedISO`는 반드시 ISO 8601 형식(`YYYY-MM-DDTHH:mm:ssZ`)을 사용해야 합니다.

### 3. 접근성

- **ARIA 레이블**: 모든 섹션에 적절한 `aria-label`이 설정되어 있습니다.
- **시맨틱 HTML**: `<section>`, `<nav>`, `<time>` 등 시맨틱 태그 사용

### 4. 성능

- **JSON-LD 삽입**: FAQSection은 `useEffect`를 사용하여 컴포넌트 마운트 시 JSON-LD를 삽입합니다. 중복 삽입을 방지하기 위해 `id`를 사용합니다.

---

## 향후 개선 사항

### 1. Article 스키마 추가

포스트 상세 페이지에 Article 스키마를 추가하여 더 풍부한 구조화 데이터 제공

### 2. HowTo 스키마 적용

단계별 가이드가 있는 포스트에 HowTo 스키마 적용

### 3. Breadcrumb 스키마

네비게이션 경로를 Breadcrumb 스키마로 제공

### 4. 동적 콘텐츠 생성

서버 사이드에서 AnswerBlock과 FAQSection의 콘텐츠를 동적으로 생성하여 더 정확한 정보 제공

---

## 참고 자료

- [Google Search Central - 구조화된 데이터](https://developers.google.com/search/docs/appearance/structured-data)
- [Schema.org - FAQPage](https://schema.org/FAQPage)
- [GEO 최적화 가이드](https://www.geo-optimization.com/)

---

## 작성 정보

- **작성일**: 2026년 1월 26일
- **프로젝트**: TrouBlog Frontend
- **버전**: 1.0.0
