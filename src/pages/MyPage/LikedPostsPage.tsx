import TroubleShootingCard from "@/features/mypage/ui/TroubleShootingCard";
import { PATH } from "@/shared/config/paths";
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
    navigate(PATH.COMMUNITY_POST(String(postId)));
  };

  const showEmpty = !loading && !error && items.length === 0;

  return (
    <div className="w-full max-w-[948px] mx-auto px-4 sm:px-0 flex flex-col gap-6 sm:gap-10 pb-16 sm:pb-[78px]">
      {/* 에러/로딩 */}
      {error && (
        <div className="text-red-600 self-start text-body-14-regular sm:text-body-16-regular">
          {error}
        </div>
      )}

      <div className="flex flex-col items-start self-stretch">
        {/* 빈 상태 */}
        {showEmpty && (
          <div className="w-full flex h-[132px] justify-center items-center rounded-[8px]">
            <span className="text-body-20-regular">
              아직 좋아요한 포스트가 없어요.
            </span>
          </div>
        )}

        {/* 리스트 */}
        {!showEmpty &&
          items.map((card) => (
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
        {!showEmpty && hasNext && !loading && (
          <div ref={sentinelRef} style={{ height: 1 }} />
        )}
      </div>
    </div>
  );
};

export default LikedPostsPage;
