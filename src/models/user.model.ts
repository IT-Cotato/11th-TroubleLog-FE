export interface ProfileData {
  userId: number;
  nickname: string;
  field: string;
  bio: string;
  githubUrl: string;
  profileUrl?: string | null;
  profileImageUrl?: string | null;
}

export interface UpdatedProfileData {
  userId: number;
  nickname: string;
  field: string;
  bio: string;
  githubUrl: string;
  profileUrl: string;
}

export interface UserInfoData {
  userId: number;
  nickname: string;
  profileUrl: string;
  profileImgUrl?: string | null;
  bio: string;
  followerNum: number;
  followingNum: number;
  isFollowed: boolean;
  githubUrl?: string;
}

export interface FollowingData {
  userId: number;
  nickname: string;
  email: string;
  profileUrl: string;
  isFollowed: boolean;
}
