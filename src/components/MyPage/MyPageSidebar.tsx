import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import FollowButton from "@/components/Button/FollowButton";
import { useMyPageStore } from "@/store/useMyPageStore";
import type { StatusType } from "@/types/project";
import { PATH } from "@/constants/paths";
import { MYPAGE_SUBPATH } from "@/constants/routes";
import userIcon from "@/assets/icons/user.svg";
import circleYIcon from "@/assets/icons/circle_y.svg";
import circleGIcon from "@/assets/icons/circle_g.svg";
import circleBIcon from "@/assets/icons/circle_b.svg";
import { getUserInfo, postFollow, postUnfollow } from "@/api/user.api";
import type { UserInfoData } from "@/models/user.model";

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

  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const basePath = PATH.MYPAGE(id!);
  const isOnMainPage = location.pathname === basePath;

  const refetch = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getUserInfo(Number(id));
      setUserInfo(data);
      setViewedUser({
        id: Number(id),
        nickname: data?.nickname ?? null,
      });
    } catch (error) {
      console.error("사용자 정보 불러오기 실패:", error);
    }
  }, [id, setViewedUser]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    return () => {
      resetViewedUser();
    };
  }, [resetViewedUser]);

  // 현재 경로가 메인 페이지가 아니면 태그 탭 자동 초기화
  useEffect(() => {
    const basePath = PATH.MYPAGE(id!);
    const onMain = location.pathname === basePath;
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
    `flex items-center gap-[8px] self-stretch ${
      selectedStatus === status ? "text-black text-body-16-semibold" : ""
    }`;

  const getMenuButtonClass = (match: boolean) =>
    `${match ? "text-black" : "text-gray3"} text-head-20-semibold`;

  // 팔로우
  const handleFollow = async (targetId: number) => {
    if (!userInfo || followLoading) return;
    setFollowLoading(true);

    setUserInfo((prev) =>
      prev
        ? {
            ...prev,
            isFollowed: true,
            followerNum: (prev.followerNum ?? 0) + 1, // 상대방의 팔로워 수 증가
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

  // 언팔로우
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
      // 롤백
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
    <div className="flex w-[296px] flex-col items-start gap-[140px]">
      {/* 상단 프로필 영역 */}
      <div className="flex flex-col items-center gap-3 self-stretch">
        <img
          src={userInfo?.profileUrl || userIcon}
          alt="user"
          className="w-[288px] h-[288px]"
        />
        <div className="flex flex-col items-start gap-3">
          <div className="flex flex-col items-start gap-2">
            <p className="text-head-32-semibold">{userInfo?.nickname}</p>

            <div className="flex gap-1 text-body-20-regular text-gray4">
              <button onClick={handleNavigate(MYPAGE_SUBPATH.FOLLOWING, true)}>
                팔로잉 {userInfo?.followingNum}
              </button>
              <span>·</span>
              <button onClick={handleNavigate(MYPAGE_SUBPATH.FOLLOWER, true)}>
                팔로워 {userInfo?.followerNum}
              </button>
            </div>

            <p className="text-body-20-regular pt-4 pb-1">{userInfo?.bio}</p>

            {props.isMyPage ? (
              <FollowButton
                label="프로필 수정"
                colorClass="bg-primary"
                onClick={handleNavigate(MYPAGE_SUBPATH.EDIT_PROFILE)}
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
        <div className="flex flex-col items-start gap-9 self-stretch text-gray3 text-head-20-semibold">
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
            <div className="flex flex-col items-start gap-[13px] pt-2 text-body-16-regular text-gray3">
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
                <span>작성 완료 ({props.counts.complete})</span>
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
                <span>작성+요약 완료 ({props.counts.created})</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleNavigate(MYPAGE_SUBPATH.STATISTICS, true)}
            className={getMenuButtonClass(
              location.pathname.includes(MYPAGE_SUBPATH.STATISTICS)
            )}
          >
            통계 시각화
          </button>
          <button
            onClick={handleNavigate(MYPAGE_SUBPATH.LIKES, true)}
            className={getMenuButtonClass(
              location.pathname.includes(MYPAGE_SUBPATH.LIKES)
            )}
          >
            좋아요한 포스트
          </button>
        </div>
      ) : (
        <>
          {/* 태그 분석 (다른 사용자) */}
          <div className="flex flex-col items-start gap-[12px] self-stretch">
            <div className="w-full">
              <div className="flex flex-col items-start gap-[12px]">
                <span className="text-head-20-semibold">태그 분석</span>
                <div className="w-full h-[1px] bg-[#939393]" />
              </div>

              <div className="flex flex-col items-start gap-[10px] pt-[12px]">
                {/* 전체 보기 */}
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

                {/* 태그 리스트 */}
                {props.sortedTags.map(([tag, count]) => {
                  const isSelected = props.selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => props.onSelectTag(isSelected ? null : tag)}
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
        </>
      )}
    </div>
  );
};

export default MyPageSideBar;
