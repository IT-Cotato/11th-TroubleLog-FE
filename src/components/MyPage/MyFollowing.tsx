import { useEffect, useState } from "react";
import FollowingBtn from "./FollowingBtn";
import type { FollowingData } from "@/models/user.model";
import {
  getFollowers,
  getFollowings,
  postFollow,
  postUnfollow,
} from "@/api/user.api";
import { useParams } from "react-router-dom";

const MyFollowing = () => {
  const [followList, setFollowList] = useState<FollowingData[]>([]);
  const { id } = useParams();
  const userId = Number(id);

  useEffect(() => {
    const path = location.pathname.split("/").pop();

    const fetchData = async () => {
      try {
        let data: FollowingData[] = [];

        if (path === "following") {
          data = await getFollowings(userId);
        } else if (path === "follower") {
          data = await getFollowers(userId);
        }

        setFollowList(data);
      } catch (e) {
        console.error("목록 가져오기 실패", e);
      }
    };

    fetchData();
  }, [userId, location.pathname]);

  const handleFollowClick = async (id: number) => {
    try {
      const target = followList.find((user) => user.userId === id);

      if (!target) return;

      if (target.isFollowed) {
        await postUnfollow(id);
      } else {
        await postFollow(id);
      }

      setFollowList((prev) =>
        prev.map((user) =>
          user.userId === id ? { ...user, isFollowed: !user.isFollowed } : user
        )
      );
    } catch (e) {
      console.error("팔로우 상태 변경 실패", e);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-[948px]">
      {followList.map((user) => (
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
    </div>
  );
};

export default MyFollowing;
