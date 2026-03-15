import { useEffect, useMemo, useState } from "react";
import FollowingBtn from "./FollowingBtn";
import type { FollowingData } from "@/models/user.model";
import {
  getFollowers,
  getFollowings,
  postFollow,
  postUnfollow,
} from "@/api/user.api";
import { useLocation, useParams } from "react-router-dom";
import { useViewerId } from "@/store/auth";
import ConfirmDeleteModal from "@/shared/ui/Modal/ConfirmDeleteModal";
import { useMyPageStore } from "@/store/useMyPageStore";

const MyFollowing = () => {
  const [followList, setFollowList] = useState<FollowingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [unfollowTarget, setUnfollowTarget] = useState<{
    userId: number;
    nickname: string;
  } | null>(null);
  const [unfollowLoading, setUnfollowLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const { id } = useParams();
  const viewerId = useViewerId();
  const { pathname } = useLocation();
  const triggerSidebarRefetch = useMyPageStore((s) => s.triggerSidebarRefetch);

  // path tail 한 번만 계산
  const pathTail = useMemo(() => pathname.split("/").pop(), [pathname]);

  // 최종 조회 대상 ID: URL에 id가 있으면 사용, 없으면 viewerId로 폴백
  const targetUserId = useMemo(() => {
    const fromParam = Number(id);
    return Number.isFinite(fromParam) ? fromParam : viewerId ?? undefined;
  }, [id, viewerId]);

  useEffect(() => {
    // follower/following 외 경로면 패스
    if (pathTail !== "following" && pathTail !== "follower") return;
    // id/로그인 정보가 아직 없으면 대기
    if (!targetUserId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setErr(null);

        let data: FollowingData[] = [];
        if (pathTail === "following") data = await getFollowings(targetUserId);
        else data = await getFollowers(targetUserId);

        setFollowList(data);
      } catch (e) {
        console.error("목록 가져오기 실패", e);
        setErr("목록을 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetUserId, pathTail]);

  const handleFollowClick = (userId: number) => {
    const target = followList.find((user) => user.userId === userId);
    if (!target) return;

    if (target.isFollowed) {
      setUnfollowTarget({ userId, nickname: target.nickname ?? "" });
      return;
    }

    handleFollow(userId);
  };

  const handleFollow = async (userId: number) => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      await postFollow(userId);
      setFollowList((prev) =>
        prev.map((user) =>
          user.userId === userId ? { ...user, isFollowed: true } : user
        )
      );
      triggerSidebarRefetch();
    } catch (e) {
      console.error("팔로우 실패", e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleConfirmUnfollow = async () => {
    if (!unfollowTarget) return;
    setUnfollowLoading(true);
    try {
      await postUnfollow(unfollowTarget.userId);
      setFollowList((prev) =>
        prev.map((user) =>
          user.userId === unfollowTarget.userId
            ? { ...user, isFollowed: false }
            : user
        )
      );
      triggerSidebarRefetch();
      setUnfollowTarget(null);
    } catch (e) {
      console.error("팔로우 취소 실패", e);
    } finally {
      setUnfollowLoading(false);
    }
  };

  const closeUnfollowModal = () => setUnfollowTarget(null);

  const emptyMessage =
    pathTail === "following"
      ? "아직 팔로잉한 사용자가 없어요."
      : "아직 팔로워가 없어요.";

  const showEmpty = !loading && !err && followList.length === 0;

  return (
    <div className="w-full max-w-[948px] mx-auto px-4 sm:px-0 flex flex-col gap-4 sm:gap-6">
      {/* 에러 메시지 */}
      {err && (
        <div className="text-red-600 text-body-14-regular sm:text-body-16-regular">
          {err}
        </div>
      )}

      {/* 빈 상태 */}
      {showEmpty && (
        <div className="w-full flex h-[120px] sm:h-[132px] justify-center items-center rounded-[8px] bg-white">
          <span className="text-body-16-regular sm:text-body-20-regular">
            {emptyMessage}
          </span>
        </div>
      )}

      {/* 리스트 */}
      {!showEmpty &&
        followList.map((user) => (
          <FollowingBtn
            key={user.userId}
            userId={user.userId}
            nickname={user.nickname}
            email={user.email}
            isFollowed={user.isFollowed}
            profileUrl={user.profileUrl}
            onFollowClick={() => handleFollowClick(user.userId)}
            followButtonDisabled={!user.isFollowed && followLoading}
          />
        ))}

      {/* 로딩 스켈레톤 */}
      {loading && (
        <>
          <div className="w-full h-[64px] sm:h-[84px] bg-gray-100 rounded-[8px]" />
          <div className="w-full h-[64px] sm:h-[84px] bg-gray-100 rounded-[8px]" />
        </>
      )}

      {/* 팔로우 취소 재확인 모달 */}
      {unfollowTarget && (
        <ConfirmDeleteModal
          title={`${unfollowTarget.nickname}님의 팔로우를 취소하시겠습니까?`}
          description={`원하는 경우 ${unfollowTarget.nickname} 님을 다시 팔로우할 수 있습니다.`}
          label={unfollowLoading ? "처리 중..." : "팔로우 취소"}
          loading={unfollowLoading}
          confirmButtonClassName="bg-primary"
          onClose={closeUnfollowModal}
          onConfirm={handleConfirmUnfollow}
        />
      )}
    </div>
  );
};

export default MyFollowing;
