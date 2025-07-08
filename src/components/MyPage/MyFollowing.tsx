import { useState } from "react";
import Following from "./Following";

export interface FollowingData {
  id: number;
  name: string;
  email: string;
  follow: boolean;
}

const mockData: FollowingData[] = [
  {
    id: 0,
    name: "이름0",
    email: "rlagyflA@naver.com",
    follow: true,
  },
  {
    id: 1,
    name: "이름1",
    email: "rlagyflA@naver.com",
    follow: true,
  },
  {
    id: 2,
    name: "이름2",
    email: "rlagyflA@naver.com",
    follow: false,
  },
  {
    id: 3,
    name: "이름3",
    email: "rlagyflA@naver.com",
    follow: false,
  },
];

const MyFollowing = () => {
  const [followList, setFollowList] = useState<FollowingData[]>(mockData);

  // 백 API로 팔로잉/팔로우
  const handleFollowClick = async (id: number) => {
    try {
      // axios 사용
      setFollowList((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, follow: !user.follow } : user
        )
      );
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {followList.map((user) => (
        <Following
          key={user.id}
          name={user.name}
          email={user.email}
          follow={user.follow}
          onFollowClick={() => handleFollowClick(user.id)}
        />
      ))}
    </div>
  );
};

export default MyFollowing;
