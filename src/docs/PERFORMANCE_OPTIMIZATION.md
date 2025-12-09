# 프론트엔드 성능 최적화 가이드

이 문서는 API 응답 속도로 인한 UI 버벅임 문제를 개선하기 위한 프론트엔드 최적화 방법을 설명합니다.

## 📋 목차

1. [로딩 상태 및 스켈레톤 UI](#1-로딩-상태-및-스켈레톤-ui)
2. [낙관적 업데이트](#2-낙관적-업데이트)
3. [디바운싱/스로틀링](#3-디바운싱스로틀링)
4. [이미지 최적화](#4-이미지-최적화)
5. [메모이제이션](#5-메모이제이션)
6. [프리페칭](#6-프리페칭)

---

## 1. 로딩 상태 및 스켈레톤 UI

### 사용법

```tsx
import { LoadingSkeleton, CardListSkeleton } from "@/shared/ui/LoadingSkeleton";

function MyComponent() {
  const { data, loading } = useMyData();

  if (loading) {
    return <CardListSkeleton count={5} />;
  }

  return <div>{/* 데이터 렌더링 */}</div>;
}
```

### 컴포넌트 종류

- `LoadingSkeleton`: 범용 스켈레톤
- `CardListSkeleton`: 카드 리스트용
- `ProfileImageSkeleton`: 프로필 이미지용
- `TextLineSkeleton`: 텍스트 라인용

---

## 2. 낙관적 업데이트

API 응답을 기다리지 않고 즉시 UI를 업데이트하여 반응성을 향상시킵니다.

### 사용법

```tsx
import { useOptimisticUpdate } from "@/shared/hooks/useOptimisticUpdate";

function LikeButton({ initialLiked }: { initialLiked: boolean }) {
  const { optimisticValue, setOptimisticValue, rollback } =
    useOptimisticUpdate(initialLiked);

  const handleLike = async () => {
    // 즉시 UI 업데이트
    setOptimisticValue(true);

    try {
      await likePost();
    } catch {
      // 실패 시 롤백
      rollback();
    }
  };

  return <button onClick={handleLike}>{optimisticValue ? "❤️" : "🤍"}</button>;
}
```

### 적용 예시

- 좋아요/언라이크
- 댓글 작성/삭제
- 팔로우/언팔로우
- 북마크

---

## 3. 디바운싱/스로틀링

### 디바운싱

연속된 호출을 지연시켜 마지막 호출만 실행합니다. 검색 입력에 유용합니다.

```tsx
import { debounce } from "@/shared/utils/debounce";

function SearchInput() {
  const [query, setQuery] = useState("");

  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm: string) => {
        // API 호출
        searchAPI(searchTerm);
      }, 300),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return <input value={query} onChange={handleChange} />;
}
```

### 스로틀링

일정 시간 간격으로만 함수를 실행합니다. 스크롤 이벤트에 유용합니다.

```tsx
import { throttle } from "@/shared/utils/debounce";

function ScrollComponent() {
  const handleScroll = useMemo(
    () =>
      throttle(() => {
        // 스크롤 처리
        console.log("스크롤 이벤트");
      }, 100),
    []
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);
}
```

---

## 4. 이미지 최적화

### LazyImage 컴포넌트 사용

```tsx
import { LazyImage } from "@/shared/utils/imageOptimization";

function ImageGallery({ images }: { images: string[] }) {
  return (
    <div>
      {images.map((src, i) => (
        <LazyImage
          key={i}
          src={src}
          alt={`이미지 ${i + 1}`}
          className="w-full h-auto rounded-lg"
          placeholder={<div>로딩 중...</div>}
        />
      ))}
    </div>
  );
}
```

### 네이티브 lazy loading

일반 이미지에도 `loading="lazy"` 속성을 추가하세요.

```tsx
<img src={imageUrl} alt="설명" loading="lazy" className="w-full" />
```

---

## 5. 메모이제이션

### React.memo

불필요한 리렌더링을 방지합니다.

```tsx
import { memo } from "react";

const ExpensiveComponent = memo(({ data }: { data: DataType }) => {
  // 복잡한 렌더링 로직
  return <div>{/* ... */}</div>;
});
```

### useMemo

비용이 큰 계산 결과를 캐싱합니다.

```tsx
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### useCallback

함수 참조를 안정화하여 자식 컴포넌트의 불필요한 리렌더링을 방지합니다.

```tsx
const handleClick = useCallback(() => {
  // 핸들러 로직
}, [dependencies]);
```

---

## 6. 프리페칭

링크 hover 시 데이터를 미리 로드하여 페이지 전환 속도를 향상시킵니다.

```tsx
import { usePrefetch } from "@/shared/hooks/usePrefetch";
import { Link } from "react-router-dom";

function Navigation() {
  const prefetch = usePrefetch();

  return (
    <Link
      to="/user/mypage/123"
      onMouseEnter={() => prefetch("/user/mypage/123")}
    >
      마이페이지
    </Link>
  );
}
```

---

## 🎯 우선 적용 권장 사항

1. **즉시 적용 가능**

   - ✅ Suspense fallback 개선 (완료)
   - ✅ 스켈레톤 UI 추가 (완료)
   - ✅ 디바운싱/스로틀링 유틸리티 (완료)

2. **단계적 적용**

   - 낙관적 업데이트를 좋아요, 댓글 작성 등에 적용
   - 이미지 lazy loading 적용
   - 검색 입력에 디바운싱 적용

3. **장기 개선**
   - React Query 도입 검토 (자동 캐싱, 리페칭)
   - 가상 스크롤링 (긴 리스트)
   - 서비스 워커를 통한 오프라인 지원

---

## 📊 성능 측정

Chrome DevTools의 Performance 탭을 사용하여 최적화 효과를 측정하세요.

- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)
