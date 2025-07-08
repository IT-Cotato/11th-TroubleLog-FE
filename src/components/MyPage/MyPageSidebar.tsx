import { useNavigate } from "react-router-dom";
import FollowButton from "../Button/FollowButton";

interface MyPageSideBarProps {
  isMyPage: boolean;
}

const mockProfile = {
  name: "안수이",
  followingCount: 8,
  followerCount: 6,
  bio: "안녕하세요. 프론트엔드 개발자입니다!",
};

const MyPageSideBar = ({ isMyPage }: MyPageSideBarProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => () => {
    navigate(path);
  };

  const troubleShootingItems = [
    {
      icon: "/icons/circle_y.svg",
      label: "작성 중 (1)",
    },
    {
      icon: "/icons/circle_g.svg",
      label: "작성 완료 (2)",
    },
    {
      icon: "/icons/circle_b.svg",
      label: "작성+요약 완료 (1)",
    },
  ];

  return (
    <div className="flex w-[296px] flex-col items-start gap-[140px]">
      {/* 상단 프로필 영역 */}
      <div className="flex flex-col items-center gap-3 self-stretch">
        <img src="/icons/user.svg" alt="user" className="w-[288px] h-[288px]" />
        <div className="flex flex-col items-start gap-3">
          <div className="flex flex-col items-start gap-2">
            <p className="text-head-32-semibold">{mockProfile.name}</p>

            <div className="flex gap-1 text-body-20-regular text-gray4">
              <button onClick={handleNavigate("following")}>
                팔로잉 {mockProfile.followingCount}
              </button>
              <span>·</span>
              <button onClick={handleNavigate("follower")}>
                팔로워 {mockProfile.followerCount}
              </button>
            </div>

            <p className="text-body-20-regular pt-4 pb-1">{mockProfile.bio}</p>

            {isMyPage ? (
              <FollowButton
                label="프로필 수정"
                colorClass="bg-primary"
                onClick={() => {
                  navigate("editprofile");
                }}
              />
            ) : (
              <FollowButton label="팔로우" colorClass="bg-primary" />
            )}
          </div>
        </div>
      </div>

      {/* 하단 메뉴 */}
      <div className="flex flex-col items-start gap-9 self-stretch text-gray3 text-head-20-semibold">
        <div className="w-full">
          <div className="border-b border-gray3 w-full pb-2">
            내 트러블 슈팅
          </div>

          <div className="flex flex-col items-start gap-[13px] pt-2 text-body-16-regular text-gray3">
            <span>전체보기 (4)</span>
            {troubleShootingItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <img src={item.icon} alt="icon" className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button>통계 시각화</button>
        <button>좋아요한 포스트</button>
      </div>
    </div>
  );
};

export default MyPageSideBar;
