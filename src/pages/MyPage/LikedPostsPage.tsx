import TroubleShootingCard from "@/components/MyPage/TroubleShootingCard";
import { mockCards } from "@/mocks/mockCards";
import { mapToTroubleShootingCard } from "@/utils/mappers/cardMapper";

const LikedPostsPage = () => {
  // 임시
  const likedCards = mockCards.filter((c) => !c.isMine);

  return (
    <div className="flex flex-col items-end gap-[40px] w-[948px] pb-[78px]">
      {/* 좋아요한 포스트 목록 */}
      <div className="flex flex-col items-start self-stretch">
        {likedCards.map((card) => (
          <TroubleShootingCard
            key={card.id}
            {...mapToTroubleShootingCard(card)}
          />
        ))}
      </div>
    </div>
  );
};

export default LikedPostsPage;
