import type { TroubleShootingCardProps } from "@/components/MyPage/TroubleShootingCard";
import TroubleShootingCard from "@/components/MyPage/TroubleShootingCard";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

type CardData = Omit<TroubleShootingCardProps, "onDeleted">;

const SearchResultPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get("query") || "";
  const scope = params.get("scope") || "community";

  const [results, setResults] = useState<CardData[]>([]);

  // 삭제 시 목록에서 제거
  const handleDeleted = (postId: number) => {
    setResults((prev) => prev.filter((c) => Number(c.id) !== postId));
  };

  useEffect(() => {
    const dummyResults: CardData[] = [
      {
        id: "1",
        isMine: false,
        errorCategory: "빌드 오류",
        title: "React Vite 빌드 오류 해결",
        content: "빌드 시 발생한 'cannot find module' 오류 해결 과정...",
        tags: ["React", "Vite", "build"],
        createdAt: "2025-07-24",
        status: "complete",
        likeCount: 12,
        commentCount: 3,
        importance: 4,
        authorName: "이름",
        isSearchResult: true,
      },
      {
        id: "2",
        isMine: false,
        errorCategory: "빌드 오류",
        title: "React Vite 빌드 오류 해결",
        content: "빌드 시 발생한 'cannot find module' 오류 해결 과정...",
        tags: ["React", "Vite", "build"],
        createdAt: "2025-07-24",
        status: "complete",
        likeCount: 12,
        commentCount: 3,
        importance: 4,
        authorName: "이름",
        isSearchResult: true,
      },
    ];

    setResults(dummyResults);
  }, [query, scope]);

  return (
    <div className="mt-[179px] mb-[68px] flex w-[1200px] flex-col items-start gap-[56px] mx-auto">
      <span className="text-head-32-regular self-stretch">
        총 {results.length}개의 포스트를 찾았어요.
      </span>

      <div className="flex flex-col items-start self-stretch">
        {results.map((item) => (
          <TroubleShootingCard
            key={item.id}
            {...item}
            onDeleted={handleDeleted}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchResultPage;
