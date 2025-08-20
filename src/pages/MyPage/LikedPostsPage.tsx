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
    <div className="w-full max-w-[948px] mx-auto px-4 sm:px-0 flex flex-col gap-6 sm:gap-10 pb-16 sm:pb-[78px]">
      {/* 에러/로딩 */}
      {error && (
        <div className="text-red-600 self-start text-body-14-regular sm:text-body-16-regular">
          {error}
        </div>
      )}

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
            <div className="w-full h-[96px] sm:h-[120px] bg-gray-100 rounded mb-3" />
            <div className="w-full h-[96px] sm:h-[120px] bg-gray-100 rounded mb-3" />
          </>
        )}

        {/* 무한 스크롤 센티널 */}
        {hasNext && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>
    </div>
  );
};

export default LikedPostsPage;
