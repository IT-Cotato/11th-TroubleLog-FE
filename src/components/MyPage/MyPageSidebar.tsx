import { useNavigate, useLocation, useParams } from "react-router-dom";
import FollowButton from "../Button/FollowButton";
import { useMyPageStore } from "@/store/useMyPageStore";
import type { StatusType } from "@/types/project";
import { mockCards } from "@/mocks/mockCards";

interface MyPageSideBarProps {
  isMyPage: boolean;
  counts: {
    all: number;
    inProgress: number;
    complete: number;
    created: number;
  };
}

const mockProfile = {
  name: "안수이",
  followingCount: 8,
  followerCount: 6,
  bio: "안녕하세요. 프론트엔드 개발자입니다!",
};

const MyPageSideBar = ({ isMyPage, counts }: MyPageSideBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { selectedStatus, setSelectedStatus, resetSelectedStatus } =
    useMyPageStore();
  const { selectedTag, setSelectedTag, resetSelectedTag } = useMyPageStore();

  const basePath = `/user/mypage/${id}`;
  const isOnMainPage = location.pathname === basePath;

  const handleNavigate =
    (subPath: string = "", clearStatus = false) =>
    () => {
      if (clearStatus) {
        resetSelectedStatus();
        resetSelectedTag();
      }
      navigate(`${basePath}${subPath ? `/${subPath}` : ""}`);
    };

  const getFilterButtonClass = (status: StatusType | "all") =>
    `flex items-center gap-[8px] self-stretch ${
      selectedStatus === status ? "text-black text-body-16-semibold" : ""
    }`;

  const getMenuButtonClass = (match: boolean) =>
    `${match ? "text-black" : "text-gray3"} text-head-20-semibold`;

  // 다른 사용자의 카드만 (임시)
  const publicCards = mockCards.filter((card) => !card.isMine);

  const allTags = publicCards.flatMap((card) => card.tags);
  const tagCounts: Record<string, number> = {};
  allTags.forEach((tag) => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };

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
                onClick={handleNavigate("editprofile")}
              />
            ) : (
              <FollowButton label="팔로우" colorClass="bg-primary" />
            )}
          </div>
        </div>
      </div>

      {/* 하단 메뉴 */}
      {isMyPage ? (
        <div className="flex flex-col items-start gap-9 self-stretch text-gray3 text-head-20-semibold">
          <div className="w-full">
            {/* 헤더 텍스트 */}
            <div
              className={`pb-2 border-b ${
                isOnMainPage && selectedStatus
                  ? "text-black border-black"
                  : "border-gray3"
              } `}
            >
              내 트러블 슈팅
            </div>

            {/* 트러블슈팅 필터 버튼들 */}
            <div className="flex flex-col items-start gap-[13px] pt-2 text-body-16-regular text-gray3">
              <button
                onClick={() => {
                  setSelectedStatus("all");
                  handleNavigate()();
                }}
                className={getFilterButtonClass("all")}
              >
                전체보기 ({counts.all})
              </button>
              <button
                onClick={() => {
                  setSelectedStatus("inProgress");
                  handleNavigate()();
                }}
                className={getFilterButtonClass("inProgress")}
              >
                <img src="/icons/circle_y.svg" className="w-3.5 h-3.5" />
                <span>작성 중 ({counts.inProgress})</span>
              </button>
              <button
                onClick={() => {
                  setSelectedStatus("complete");
                  handleNavigate()();
                }}
                className={getFilterButtonClass("complete")}
              >
                <img src="/icons/circle_g.svg" className="w-3.5 h-3.5" />
                <span>작성 완료 ({counts.complete})</span>
              </button>
              <button
                onClick={() => {
                  setSelectedStatus("created");
                  handleNavigate()();
                }}
                className={getFilterButtonClass("created")}
              >
                <img src="/icons/circle_b.svg" className="w-3.5 h-3.5" />
                <span>작성+요약 완료 ({counts.created})</span>
              </button>
            </div>
          </div>

          {/* 일반 메뉴 버튼들 */}
          <button
            onClick={handleNavigate("statistics", true)}
            className={getMenuButtonClass(
              location.pathname.includes("statistics")
            )}
          >
            통계 시각화
          </button>
          <button
            onClick={handleNavigate("likes", true)}
            className={getMenuButtonClass(location.pathname.includes("likes"))}
          >
            좋아요한 포스트
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-[12px] self-stretch">
          <div className="w-full">
            {/* 헤더 텍스트 */}
            <div className="flex flex-col items-start gap-[12px]">
              <span className="text-head-20-semibold">태그 분석</span>
              <div className="w-full h-[1px] bg-[#939393]" />
            </div>

            {/* 태그 목록 */}
            <div className="flex flex-col items-start gap-[10px] pt-[12px]">
              {sortedTags.map(([tag, count]) => {
                const isSelected = tag === selectedTag;
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`transition-colors ${
                      isSelected
                        ? "text-body-16-semibold"
                        : "text-body-16-regular text-gray3"
                    }`}
                  >
                    {tag} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPageSideBar;
