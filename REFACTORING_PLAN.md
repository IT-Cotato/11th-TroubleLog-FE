# 코드 리팩토링 계획서

## 📋 개요

이 문서는 TroubleLog FE 프로젝트의 전반적인 코드 리팩토링 계획을 정리한 것입니다.

## 🔍 현재 상태 분석

### 발견된 주요 이슈들

1. **대형 컴포넌트 파일**

   - `CommunityPostDetail.tsx`: 1,448줄
   - `TempWritePage.tsx`: 1,212줄
   - `FreeFormWritePage.tsx`: 1,357줄
   - 하나의 컴포넌트에 너무 많은 책임이 집중되어 있음

2. **타입 안전성 부족**

   - `any` 타입 사용: 130건 발견
   - 타입 단언(`as any`) 남용
   - 런타임 에러 가능성 증가

3. **중복 코드**

   - 로딩/에러 처리 패턴이 각 컴포넌트마다 반복
   - API 호출 후 상태 관리 로직 중복
   - 유틸리티 함수들의 중복 구현

4. **성능 이슈**

   - 불필요한 리렌더링 가능성
   - 메모이제이션 부족
   - API 호출 최적화 부족

5. **반응형 디자인**

   - Tailwind breakpoints 사용 중이지만 일관성 부족
   - 모바일 환경 대응 검증 필요

6. **코드 가독성**

   - 긴 함수들
   - 복잡한 조건문 중첩
   - 매직 넘버/문자열 사용

7. **콘솔 로그**
   - 108건의 console.log/warn/error 발견
   - 프로덕션에서 제거 필요

---

## 🎯 리팩토링 목표

1. ✅ 불필요한 코드 및 로직 제거
2. ✅ 성능 최적화 (렌더링, API 호출, 로딩/에러 UI/UX)
3. ✅ 코드 가독성 향상 (폴더 구조 포함)
4. ✅ 화면 반응형 개선 (PC 및 모바일)

---

## 📝 단계별 리팩토링 계획

### Phase 1: 기초 정리 (1-2주)

#### 1.1 코드 정리

- [ ] **불필요한 파일 제거**

  - `dist/` 폴더 내 중복 파일들 정리 (index 2.html, manifest 2.json 등)
  - 사용하지 않는 아이콘 파일 정리

- [ ] **콘솔 로그 정리**

  - 프로덕션 빌드에서 제거되도록 설정
  - 개발용 로그는 `import.meta.env.DEV` 조건부 처리
  - 에러 로깅은 에러 트래킹 시스템으로 전환 검토

- [ ] **주석 및 TODO 정리**
  - 불필요한 주석 제거
  - TODO 항목 정리 및 이슈 트래커로 이동

#### 1.2 타입 안전성 개선

- [ ] **`any` 타입 제거**

  - 우선순위: 페이지 컴포넌트 → API 레이어 → 유틸 함수
  - 타입 정의 파일(`*.model.ts`) 보완
  - API 응답 타입 명시

- [ ] **타입 단언 최소화**

  - `as any` → 적절한 타입 정의 또는 타입 가드 사용
  - 예: `(myDetail as any)?.isVisible` → 타입 가드 함수 생성

- [ ] **타입 유틸리티 활용**
  - `Partial`, `Pick`, `Omit` 등 적극 활용
  - 제네릭 타입 정의로 재사용성 향상

#### 1.3 폴더 구조 개선

```
현재 구조는 FSD (Feature-Sliced Design)를 따르고 있으나 일관성 개선 필요

개선 사항:
- [x] 공통 타입 정의 위치 통일 (types/ vs models/)
  - types/: 공통 타입, API 응답 타입, Navigation 타입, UI 타입
  - models/: 도메인 모델 (비즈니스 로직 관련)
- [x] API 응답 모델과 도메인 모델 분리 명확화
  - 문서화 완료: docs/FOLDER_STRUCTURE.md
- [x] 컴포넌트 분리 기준 문서화
  - 폴더 구조 가이드 작성 완료
```

---

### Phase 2: 컴포넌트 분리 및 재구성 (2-3주)

#### 2.1 대형 컴포넌트 분리

**CommunityPostDetail.tsx (1,448줄)**

- [ ] **로직 분리**

  - 커스텀 훅 분리:

    - `usePostDetail()`: 상세 데이터 로딩 로직
    - `usePostComments()`: 댓글 관리 로직
    - `usePostLike()`: 좋아요 로직
    - `usePostMenu()`: 메뉴/삭제 로직
    - `usePostNavigation()`: 네비게이션 로직

  - 유틸 함수 분리:

    - `buildFreeformPrefill()` → `utils/prefillBuilder.ts`
    - `buildTemplatePrefill()` → `utils/prefillBuilder.ts`
    - `parseStar()` → `utils/starParser.ts`
    - `useDetailContext()` → `hooks/useDetailContext.ts`

  - 컴포넌트 분리:
    - `PostDetailHeader`: 헤더 영역
    - `PostDetailContent`: 본문 영역
    - `PostDetailSidebar`: 사이드바 영역
    - `PostDetailComments`: 댓글 영역

**TempWritePage.tsx (1,212줄)**

- [ ] **로직 분리**

  - 커스텀 훅:

    - `useTemplateEditor()`: 에디터 상태 관리
    - `usePostSave()`: 저장 로직
    - `useSummaryPolling()`: 요약 상태 폴링
    - `useTagAutocomplete()`: 태그 자동완성

  - 컴포넌트 분리:
    - `TemplateEditorHeader`: 헤더
    - `TemplateEditorBlocks`: 블록 리스트
    - `TemplateEditorBlock`: 개별 블록
    - `TemplateEditorSave`: 저장 UI

**FreeFormWritePage.tsx (1,357줄)**

- [ ] **로직 분리**

  - 커스텀 훅:

    - `useFreeformEditor()`: 에디터 상태 관리
    - `usePostSave()`: 저장 로직 (공통)
    - `useSummaryPolling()`: 요약 상태 폴링 (공통)

  - 컴포넌트 분리:
    - `FreeformEditorHeader`: 헤더
    - `FreeformEditorBlocks`: 블록 리스트
    - `FreeformEditorBlock`: 개별 블록

#### 2.2 공통 로직 추출

- [ ] **공통 훅 생성**

  - `shared/hooks/useAsyncOperation.ts`: 비동기 작업 상태 관리
  - `shared/hooks/useApiQuery.ts`: API 호출 + 캐싱
  - `shared/hooks/useOptimisticUpdate.ts`: 낙관적 업데이트 (이미 존재하지만 개선)
  - `shared/hooks/useInfiniteScroll.ts`: 무한 스크롤 (통합)

- [ ] **공통 유틸리티**

  - `shared/utils/errorHandler.ts`: 에러 처리 유틸
  - `shared/utils/apiErrorParser.ts`: API 에러 파싱
  - `shared/utils/formatters.ts`: 날짜, 숫자 포맷팅 통합

- [ ] **공통 컴포넌트**
  - `shared/ui/LoadingSpinner.tsx`: 로딩 스피너 통일
  - `shared/ui/ErrorBoundary.tsx`: 에러 바운더리
  - `shared/ui/EmptyState.tsx`: 빈 상태 컴포넌트

---

### Phase 3: 성능 최적화 (1-2주)

#### 3.1 렌더링 최적화

- [ ] **React.memo 적용**

  - 리스트 아이템 컴포넌트 (TroubleShootingCard, TroublogCard 등)
  - 무거운 컴포넌트들

- [ ] **useMemo/useCallback 최적화**

  - 계산 비용이 큰 값들 메모이제이션
  - 이벤트 핸들러 메모이제이션
  - 의존성 배열 최적화

- [ ] **코드 스플리팅 개선**

  - 라우트 레벨: 이미 적용됨 (lazy import)
  - 컴포넌트 레벨: 모달, 무거운 에디터 등

- [ ] **가상화 (Virtualization)**
  - 긴 리스트에 React Virtual 또는 react-window 적용 검토
  - 예: 댓글 목록, 검색 결과

#### 3.2 API 호출 최적화

- [ ] **React Query 도입 검토**

  - 현재: 수동 상태 관리
  - 제안: React Query (TanStack Query)로 전환
  - 장점: 캐싱, 리프레시, 재시도 로직 자동화

- [ ] **API 호출 중복 방지**

  - `HomePage.tsx`의 `inflight` Map 패턴을 공통화
  - 요청 디바운싱/스로틀링

- [ ] **프리페칭**

  - `usePrefetch.ts` 개선 및 확장
  - 링크 호버 시 데이터 프리페칭

- [ ] **낙관적 업데이트**
  - 좋아요, 댓글 등 즉시 UI 업데이트
  - `useOptimisticUpdate` 훅 개선

#### 3.3 이미지 최적화

- [ ] **이미지 레이지 로딩**

  - `loading="lazy"` 속성 추가
  - Intersection Observer 활용

- [ ] **이미지 포맷 최적화**

  - WebP 포맷 지원
  - 반응형 이미지 (srcset)

- [ ] **이미지 압축**
  - 업로드 전 클라이언트 사이드 압축
  - CDN 활용 검토

#### 3.4 번들 크기 최적화

- [ ] **번들 분석**

  - `vite-bundle-visualizer` 또는 `rollup-plugin-visualizer` 사용
  - 큰 의존성 식별

- [ ] **트리 쉐이킹**

  - lodash 대신 개별 함수 import
  - 아이콘 라이브러리 최적화 (react-icons)

- [ ] **의존성 검토**
  - 사용하지 않는 라이브러리 제거
  - 대체 라이브러리 검토 (더 가벼운 대안)

---

### Phase 4: 에러 처리 및 로딩 상태 개선 (1주)

#### 4.1 에러 처리 표준화

- [ ] **에러 바운더리 구현**

  - 페이지 레벨 에러 바운더리
  - 섹션별 에러 바운더리 (부분 실패 허용)

- [ ] **에러 처리 유틸 통합**

  - `shared/utils/errorHandler.ts` 생성
  - API 에러 → 사용자 친화적 메시지 변환
  - 에러 타입별 처리 전략 정의

- [ ] **에러 로깅**
  - Sentry 또는 유사 서비스 연동 검토
  - 개발 환경: 콘솔
  - 프로덕션: 에러 트래킹 시스템

#### 4.2 로딩 상태 개선

- [ ] **로딩 UI 통일**

  - 스켈레톤 UI 도입 (현재 `LoadingSkeleton.tsx` 개선)
  - 페이지별 로딩 상태 통일

- [ ] **부분 로딩**

  - 전체 페이지 블로킹 대신 섹션별 로딩
  - Suspense 경계 활용

- [ ] **에러 상태 UI**
  - 재시도 버튼 포함
  - 사용자 친화적 에러 메시지
  - `EmptyState` 컴포넌트 활용

---

### Phase 5: 반응형 디자인 개선 (1-2주)

#### 5.1 브레이크포인트 통일

- [ ] **Tailwind 설정 개선**

  ```typescript
  // tailwind.config.ts
  theme: {
    screens: {
      'sm': '640px',   // 모바일 가로
      'md': '768px',   // 태블릿
      'lg': '1024px',  // 작은 노트북
      'xl': '1280px',  // 데스크톱
      '2xl': '1536px', // 큰 데스크톱
    }
  }
  ```

- [ ] **반응형 유틸리티 클래스 통일**
  - 컨테이너 최대 너비 일관성
  - 패딩/마진 스케일 통일

#### 5.2 모바일 최적화

- [ ] **터치 인터랙션**

  - 버튼 최소 터치 영역 (44x44px)
  - 스와이프 제스처 지원 검토

- [ ] **모바일 네비게이션**

  - 햄버거 메뉴 개선
  - 하단 네비게이션 바 검토

- [ ] **폰트 크기 조정**
  - `global.css`의 텍스트 클래스 검토
  - 가독성 테스트 (다양한 디바이스)

#### 5.3 레이아웃 개선

- [ ] **그리드 시스템**

  - 일관된 그리드 사용
  - Flexbox/Grid 혼용 기준 정리

- [ ] **컨테이너 너비**

  - 페이지별 최대 너비 통일
  - 사이드바 레이아웃 반응형 개선

- [ ] **이미지 반응형**
  - 모든 이미지에 반응형 클래스 적용
  - 아스펙트 비율 유지

#### 5.4 테스트

- [ ] **디바이스 테스트**

  - 주요 디바이스별 테스트 체크리스트 작성
  - 실제 디바이스에서 테스트

- [ ] **브라우저 호환성**
  - 주요 브라우저 테스트
  - 폴리필 필요 여부 확인

---

### Phase 6: 코드 품질 개선 (지속적)

#### 6.1 코드 스타일 통일

- [ ] **ESLint 규칙 강화**

  - `eslint.config.js` 검토 및 개선
  - 커스텀 규칙 추가 (예: 컴포넌트 최대 라인 수)

- [ ] **Prettier 설정**

  - Prettier 통합 (있다면 설정 검토)
  - 포매팅 자동화

- [ ] **네이밍 컨벤션**
  - 컴포넌트, 함수, 변수 네이밍 통일
  - 문서화

#### 6.2 테스트 코드

- [ ] **테스트 프레임워크 도입**

  - Vitest + React Testing Library
  - 유닛 테스트 작성

- [ ] **테스트 커버리지**
  - 핵심 비즈니스 로직 우선
  - 유틸리티 함수 테스트
  - 커스텀 훅 테스트

#### 6.3 문서화

- [ ] **README 업데이트**

  - 프로젝트 구조 설명
  - 개발 환경 설정
  - 빌드 및 배포 가이드

- [ ] **코드 문서화**

  - JSDoc 주석 추가 (복잡한 함수)
  - 타입 문서화
  - API 문서화

- [ ] **컴포넌트 스토리북**
  - Storybook 도입 검토
  - 주요 컴포넌트 문서화

---

## 🔧 추가 개선 제안

### 1. 상태 관리 개선

- **현재**: Zustand 사용 (간단한 상태)
- **제안**:
  - 서버 상태: React Query 도입
  - 클라이언트 상태: Zustand 유지 (현재 적절)
  - 폼 상태: React Hook Form 도입 검토

### 2. 폼 관리

- **현재**: 수동 상태 관리
- **제안**: React Hook Form 도입
  - 검증 로직 통일
  - 성능 최적화
  - 코드 간소화

### 3. 접근성 (a11y)

- [ ] ARIA 레이블 추가
- [ ] 키보드 네비게이션 지원
- [ ] 스크린 리더 호환성
- [ ] 색상 대비 비율 준수

### 4. 국제화 (i18n)

- [ ] 다국어 지원 검토
- [ ] 텍스트 하드코딩 → 상수 파일로 이동
- [ ] i18next 또는 유사 라이브러리 도입 검토

### 5. 성능 모니터링

- [ ] Web Vitals 측정
- [ ] Lighthouse CI 통합
- [ ] 실사용자 모니터링 (RUM) 검토

### 6. 보안 강화

- [ ] XSS 방지 검토 (마크다운 렌더링)
- [ ] CSRF 토큰 확인
- [ ] 민감 정보 노출 방지 (로컬스토리지)

### 7. 개발 경험 개선

- [ ] VS Code 설정 공유 (.vscode/)
- [ ] Git hooks (Husky + lint-staged)
- [ ] 커밋 메시지 컨벤션

---

## 📊 우선순위 매트릭스

### 높은 우선순위 (즉시 시작)

1. ✅ Phase 1: 기초 정리 (타입 안전성, 코드 정리)
2. ✅ Phase 2: 대형 컴포넌트 분리
3. ✅ Phase 4: 에러 처리 및 로딩 상태

### 중간 우선순위 (단기)

4. ✅ Phase 3: 성능 최적화 (렌더링, API)
5. ✅ Phase 5: 반응형 디자인

### 낮은 우선순위 (장기)

6. ✅ Phase 6: 코드 품질 (테스트, 문서화)
7. ✅ 추가 개선사항

---

## 🚀 실행 계획

### 1주차

- Phase 1.1, 1.2 시작 (코드 정리, 타입 안전성)

### 2주차

- Phase 1.3, 2.1 시작 (폴더 구조, 컴포넌트 분리)

### 3-4주차

- Phase 2 계속 (컴포넌트 분리 완료)
- Phase 4 시작 (에러 처리)

### 5-6주차

- Phase 3 (성능 최적화)
- Phase 5 (반응형 디자인)

### 7주차 이후

- Phase 6 (코드 품질)
- 추가 개선사항

---

## 📝 체크리스트 템플릿

각 Phase를 시작할 때 다음 체크리스트를 사용하세요:

```markdown
## Phase X: [제목]

### 준비

- [ ] 관련 파일 목록 작성
- [ ] 브랜치 생성 (`refactor/phase-x`)
- [ ] 테스트 계획 수립

### 실행

- [ ] 각 항목별 구현
- [ ] 코드 리뷰
- [ ] 테스트

### 완료

- [ ] 문서 업데이트
- [ ] PR 작성 및 머지
- [ ] 다음 Phase 준비
```

---

## 📚 참고 자료

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Query Documentation](https://tanstack.com/query/latest)

---

## ⚠️ 주의사항

1. **점진적 리팩토링**

   - 한 번에 모든 것을 바꾸지 말 것
   - 작은 단위로 나누어 진행
   - 각 단계마다 테스트 및 검증

2. **기능 유지**

   - 리팩토링 중에도 기존 기능 정상 동작 보장
   - 회귀 테스트 필수

3. **팀 협업**

   - 리팩토링 계획 공유
   - 코드 리뷰 필수
   - 문서화 지속

4. **성능 측정**
   - 리팩토링 전후 성능 비교
   - 번들 크기 모니터링
   - 렌더링 성능 측정

---

**작성일**: 2024년
**최종 수정일**: 2024년
**버전**: 1.0
