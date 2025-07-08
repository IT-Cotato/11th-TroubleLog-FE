import { useEffect, useState } from "react";
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

  useEffect(() => {
    const path = location.pathname.split("/").pop();

    const fetchData = async () => {
      try {
        if (path === "following") {
          // 백엔드 팔로잉 목록 API 호출
        } else if (path === "follower") {
          // 백엔드 팔로워 목록 API 호출
        }
        setFollowList(mockData);
      } catch (e) {
        console.log(e);
      }
    };

    fetchData();
  }, []);

  // 백 팔로잉/팔로우 T/F API 호출
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
