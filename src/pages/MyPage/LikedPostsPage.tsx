import { useState } from "react";
import TroubleShootingCard from "@/components/MyPage/TroubleShootingCard";
import { mockCards } from "@/mocks/mockCards";
import { mapToTroubleShootingCard } from "@/mappers/cardMapper";

const LikedPostsPage = () => {
  const [likedCards, setLikedCards] = useState(() =>
    mockCards.filter((c) => !c.isMine)
  );

  const handleDeleted = (postId: number) => {
    setLikedCards((prev) => prev.filter((c) => c.id !== postId));
  };

  return (
    <div className="flex flex-col items-end gap-[40px] w-[948px] pb-[78px]">
      <div className="flex flex-col items-start self-stretch">
        {likedCards.map((card) => (
          <TroubleShootingCard
            key={card.id}
            {...mapToTroubleShootingCard(card)}
            onDeleted={handleDeleted}
          />
        ))}
      </div>
    </div>
  );
};

export default LikedPostsPage;
