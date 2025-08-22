import { useEffect, useState } from "react";
import FollowingBtn from "./FollowingBtn";
import type { FollowingData } from "@/models/user.model";
import {
  getFollowers,
  getFollowings,
  postFollow,
  postUnfollow,
} from "@/api/user.api";
import { useLocation, useParams } from "react-router-dom";

const MyFollowing = () => {
  const [followList, setFollowList] = useState<FollowingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { id } = useParams();
  const userId = Number(id);
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.split("/").pop();

    const fetchData = async () => {
      try {
        setLoading(true);
        setErr(null);

        let data: FollowingData[] = [];
        if (path === "following") data = await getFollowings(userId);
        else if (path === "follower") data = await getFollowers(userId);

        setFollowList(data);
      } catch (e) {
        console.error("목록 가져오기 실패", e);
        setErr("목록을 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    };

    if (Number.isFinite(userId)) {
      fetchData();
    }
  }, [userId, pathname]);

  const handleFollowClick = async (id: number) => {
    try {
      const target = followList.find((user) => user.userId === id);
      if (!target) return;

      if (target.isFollowed) await postUnfollow(id);
      else await postFollow(id);

      setFollowList((prev) =>
        prev.map((user) =>
          user.userId === id ? { ...user, isFollowed: !user.isFollowed } : user
        )
      );
    } catch (e) {
      console.error("팔로우 상태 변경 실패", e);
    }
  };

  const pathTail = pathname.split("/").pop();
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
          />
        ))}

      {/* 로딩 스켈레톤 */}
      {loading && (
        <>
          <div className="w-full h-[64px] sm:h-[84px] bg-gray-100 rounded-[8px]" />
          <div className="w-full h-[64px] sm:h-[84px] bg-gray-100 rounded-[8px]" />
        </>
      )}
    </div>
  );
};

export default MyFollowing;
