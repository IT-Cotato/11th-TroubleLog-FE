export interface ProfileData {
  userId: number;
  nickame: string;
  field: string;
  bio: string;
  githubUrl: string;
}

export interface UserInfoData {
  userId: number;
  nickame: string;
  field: string;
  bio: string;
  githubUrl: string;
  followerNum: number;
  followingNum: number;
}

export interface FollowingData {
  userId: number;
  nickname: string;
  email: string;
  profileUrl: string;
  isFollowed: boolean;
}
