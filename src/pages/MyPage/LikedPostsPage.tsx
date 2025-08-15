import TroubleShootingCard from "@/components/MyPage/TroubleShootingCard";
import { PATH } from "@/constants/paths";
import useLikedCommunityPosts from "@/hooks/useLikedCommunityPosts";
import { useNavigate } from "react-router-dom";

const LikedPostsPage = () => {
  const { items, loading, error, hasNext, sentinelRef, removeById } =
    useLikedCommunityPosts(10);

  const navigate = useNavigate();

  const handleDeleted = (postId: number) => {
    removeById(postId);
  };

  const handleCardClick = (postId: number) => {
    navigate(PATH.COMMUNITY_POST(postId));
  };

  return (
    <div className="flex flex-col items-end gap-[40px] w-[948px] pb-[78px]">
      {/* 에러/로딩 */}
      {error && <div className="text-red-600 self-start">{error}</div>}

      <div className="flex flex-col items-start self-stretch">
        {items.map((card) => (
          <TroubleShootingCard
            key={card.id}
            {...card}
            onDeleted={handleDeleted}
            onClick={handleCardClick}
          />
        ))}

        {/* 로딩 스켈레톤 */}
        {loading && (
          <>
            <div className="w-full h-[120px] bg-gray-100 rounded mb-3" />
            <div className="w-full h-[120px] bg-gray-100 rounded mb-3" />
          </>
        )}

        {/* 무한 스크롤 센티널 */}
        {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>
    </div>
  );
};

export default LikedPostsPage;
