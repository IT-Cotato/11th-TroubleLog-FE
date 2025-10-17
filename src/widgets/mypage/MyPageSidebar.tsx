import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import FollowButton from "@/shared/ui/Button/FollowButton";
import { useMyPageStore } from "@/store/useMyPageStore";
import type { StatusType } from "@/types/project";
import { PATH } from "@/shared/config/paths";
import userIcon from "@/assets/icons/user.svg";
import circleYIcon from "@/assets/icons/circle_y.svg";
import circleGIcon from "@/assets/icons/circle_g.svg";
import circleBIcon from "@/assets/icons/circle_b.svg";
import { getUserInfo, postFollow, postUnfollow } from "@/api/user.api";
import type { UserInfoData } from "@/models/user.model";
import githubIcon from "@/assets/icons/githubIcon.svg";

const SUBPATH = {
  FOLLOWING: "following",
  FOLLOWER: "follower",
  EDIT_PROFILE: "editprofile",
  STATISTICS: "statistics",
  LIKES: "likes",
} as const;

type MyPageSideBarProps =
  | {
      isMyPage: true;
      counts: {
        all: number;
        inProgress: number;
        complete: number;
        created: number;
      };
    }
  | {
      isMyPage: false;
      sortedTags: [string, number][];
      selectedTag: string | null;
      onSelectTag: (tag: string | null) => void;
    };

type DisplayUser = {
  userId?: number;
  nickname?: string;
  bio?: string;
  githubUrl?: string;
  profileUrl?: string;
  followerNum?: number;
  followingNum?: number;
  isFollowed?: boolean;
};

const MyPageSideBar = (props: MyPageSideBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const {
    selectedStatus,
    setSelectedStatus,
    resetSelectedStatus,
    resetSelectedTag,
    setViewedUser,
    resetViewedUser,
  } = useMyPageStore();

  const [userInfo, setUserInfo] = useState<DisplayUser | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const basePath = PATH.MYPAGE(id!);
  const isOnMainPage = location.pathname === basePath;

  const refetch = useCallback(async () => {
    try {
      if (!id) return;
      // 내 페이지든 남의 페이지든 동일 API 사용
      const data: UserInfoData = await getUserInfo(Number(id));
      setUserInfo({
        userId: data.userId,
        nickname: data.nickname,
        bio: data.bio,
        githubUrl: data.githubUrl, // 서버가 제공하면 표시(아래 UI는 isMyPage일 때만 노출)
        profileUrl: data.profileUrl,
        followerNum: data.followerNum,
        followingNum: data.followingNum,
        isFollowed: data.isFollowed,
      });
      setViewedUser({ id: data.userId, nickname: data.nickname ?? null });
    } catch (error) {
      console.error("사용자 정보 불러오기 실패:", error);
    }
  }, [id, props.isMyPage, setViewedUser]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => () => resetViewedUser(), [resetViewedUser]);

  useEffect(() => {
    const onMain = location.pathname === PATH.MYPAGE(id!);
    if (!onMain) {
      resetSelectedStatus();
      resetSelectedTag();
    }
  }, [location.pathname, id, resetSelectedStatus, resetSelectedTag]);

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
    `flex items-center gap-2 sm:gap-[8px] self-stretch ${
      selectedStatus === status
        ? "text-black text-body-16-semibold"
        : "text-body-16-regular text-gray3"
    }`;

  const getMenuButtonClass = (match: boolean) =>
    `${
      match ? "text-black" : "text-gray3"
    } text-head-18-semibold sm:text-head-20-semibold`;

  const handleFollow = async (targetId: number) => {
    if (!userInfo || followLoading) return;
    setFollowLoading(true);
    setUserInfo((prev) =>
      prev
        ? {
            ...prev,
            isFollowed: true,
            followerNum: (prev.followerNum ?? 0) + 1,
          }
        : prev
    );
    try {
      await postFollow(targetId);
      await refetch();
    } catch (e) {
      console.error("팔로우 실패", e);
      setUserInfo((prev) =>
        prev
          ? {
              ...prev,
              isFollowed: false,
              followerNum: Math.max(0, (prev.followerNum ?? 1) - 1),
            }
          : prev
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async (targetId: number) => {
    if (!userInfo || followLoading) return;
    setFollowLoading(true);
    setUserInfo((prev) =>
      prev
        ? {
            ...prev,
            isFollowed: false,
            followerNum: Math.max(0, (prev.followerNum ?? 1) - 1),
          }
        : prev
    );
    try {
      await postUnfollow(targetId);
      await refetch();
    } catch (e) {
      console.error("언팔로우 실패", e);
      setUserInfo((prev) =>
        prev
          ? {
              ...prev,
              isFollowed: true,
              followerNum: (prev.followerNum ?? 0) + 1,
            }
          : prev
      );
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="flex w-full md:w-[296px] flex-col items-start gap-8 sm:gap-12 xl:gap-[140px] md:sticky md:top-24 mb-12 sm:mb-16 lg:mb-24">
      {/* 상단 프로필 영역 */}
      <div className="flex flex-col items-center gap-3 self-stretch">
        <div
          className="
      relative overflow-hidden rounded-full
      w-28 h-28 sm:w-36 sm:h-36 md:w-56 md:h-56 xl:w-[288px] xl:h-[288px]
      ring-1 ring-gray-200 bg-gray-100
    "
          aria-label="사용자 프로필 이미지"
        >
          <img
            src={userInfo?.profileUrl || userIcon}
            alt="user"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // 이미지 로딩 실패 시 기본 아이콘으로 폴백
              e.currentTarget.src = userIcon;
              e.currentTarget.onerror = null;
            }}
            draggable={false}
          />
        </div>
        <div className="flex flex-col items-start gap-3 w-full">
          <div className="flex flex-col items-start gap-2 w-full">
            <p className="text-head-24-bold sm:text-head-32-semibold break-words">
              {userInfo?.nickname}
            </p>

            <div className="flex gap-1 text-body-16-regular sm:text-body-20-regular text-gray4">
              <button onClick={handleNavigate(SUBPATH.FOLLOWING, true)}>
                팔로잉 {userInfo?.followingNum ?? 0}
              </button>
              <span>·</span>
              <button onClick={handleNavigate(SUBPATH.FOLLOWER, true)}>
                팔로워 {userInfo?.followerNum ?? 0}
              </button>
            </div>

            <p className="text-body-16-regular sm:text-body-20-regular pt-3 sm:pt-4 pb-1 break-words whitespace-pre-wrap">
              {userInfo?.bio}
            </p>

            {props.isMyPage && userInfo?.githubUrl && (
              <div className="inline-flex items-center gap-2 text-body-16-regular sm:text-body-20-regular text-gray3 break-all">
                <img
                  src={githubIcon}
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 sm:w-8 sm:h-8"
                />
                <span>{userInfo.githubUrl}</span>
              </div>
            )}

            {props.isMyPage ? (
              <FollowButton
                label="프로필 수정"
                colorClass="bg-primary"
                onClick={handleNavigate(SUBPATH.EDIT_PROFILE)}
              />
            ) : userInfo?.isFollowed ? (
              <FollowButton
                label="팔로잉"
                colorClass="bg-subColor1"
                onClick={() => handleUnfollow(Number(id))}
              />
            ) : (
              <FollowButton
                label="팔로우"
                colorClass="bg-primary"
                onClick={() => handleFollow(Number(id))}
              />
            )}
          </div>
        </div>
      </div>

      {/* 하단 메뉴*/}
      {props.isMyPage ? (
        <div className="flex flex-col items-start gap-6 sm:gap-8 xl:gap-9 self-stretch text-gray3 text-head-20-semibold">
          <div className="w-full">
            <div
              className={`pb-2 border-b ${
                isOnMainPage && selectedStatus
                  ? "text-black border-black"
                  : "border-gray3"
              } `}
            >
              내 트러블 슈팅
            </div>
            <div className="flex flex-col items-start gap-3 sm:gap-[13px] pt-2 text-body-16-regular text-gray3">
              <button
                onClick={() => {
                  setSelectedStatus("all");
                  handleNavigate()();
                }}
                className={getFilterButtonClass("all")}
              >
                전체보기 ({props.counts.all})
              </button>
              <button
                onClick={() => {
                  setSelectedStatus("inProgress");
                  handleNavigate()();
                }}
                className={getFilterButtonClass("inProgress")}
              >
                <img
                  src={circleYIcon}
                  alt=""
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                />
                <span>작성 중 ({props.counts.inProgress})</span>
              </button>
              <button
                onClick={() => {
                  setSelectedStatus("complete");
                  handleNavigate()();
                }}
                className={getFilterButtonClass("complete")}
              >
                <img
                  src={circleGIcon}
                  alt=""
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                />
                <span>원본 ({props.counts.complete})</span>
              </button>
              <button
                onClick={() => {
                  setSelectedStatus("created");
                  handleNavigate()();
                }}
                className={getFilterButtonClass("created")}
              >
                <img
                  src={circleBIcon}
                  alt=""
                  aria-hidden="true"
                  className="w-3.5 h-3.5"
                />
                <span>원본+요약본 ({props.counts.created})</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleNavigate(SUBPATH.STATISTICS, true)}
            className={getMenuButtonClass(
              location.pathname.includes(SUBPATH.STATISTICS)
            )}
          >
            통계 시각화
          </button>
          <button
            onClick={handleNavigate(SUBPATH.LIKES, true)}
            className={getMenuButtonClass(
              location.pathname.includes(SUBPATH.LIKES)
            )}
          >
            좋아요한 포스트
          </button>
        </div>
      ) : (
        <>
          {/* 태그 분석 (다른 사용자) */}
          <div className="flex flex-col items-start gap-3 sm:gap-[12px] self-stretch">
            <div className="w-full">
              <div className="flex flex-col items-start gap-3 sm:gap-[12px]">
                <span className="text-head-20-semibold">태그 분석</span>
                <div className="w-full h-px bg-[#939393]" />
              </div>

              <div className="flex flex-col items-start gap-2.5 sm:gap-[10px] pt-3 sm:pt-[12px]">
                <button
                  type="button"
                  onClick={() => props.onSelectTag(null)}
                  className={`text-left ${
                    props.selectedTag === null
                      ? "font-semibold text-black"
                      : "text-gray-500"
                  }`}
                >
                  전체 보기
                </button>

                {props.sortedTags.map(([tag, count]) => {
                  const isSelected = props.selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => props.onSelectTag(isSelected ? null : tag)}
                      className={`transition-colors break-words ${
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
        </>
      )}
    </div>
  );
};

export default MyPageSideBar;
