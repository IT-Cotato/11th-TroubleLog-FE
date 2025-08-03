import type {
  FollowingData,
  ProfileData,
  UserInfoData,
} from "@/models/user.model";
import getAPIResponseData from "../utils/getAPIResponseData";

// 내 프로필 조회
export const getMyProfile = () =>
  getAPIResponseData<ProfileData>({
    url: "/user",
    method: "GET",
  });

// 사용자 정보 조회
export const getUserInfo = (userId: string) =>
  getAPIResponseData<UserInfoData>({
    url: `/user/${userId}`,
    method: "GET",
  });

// 프로필 수정
export const patchProfile = (updatedProfile: ProfileData) =>
  getAPIResponseData({
    url: "/user",
    method: "PATCH",
    data: { updatedProfile },
  });

// 팔로워 목록 조회
export const getFollowers = (userId: number) =>
  getAPIResponseData<FollowingData[]>({
    url: "/user/follower",
    method: "GET",
    params: { userId },
  });

// 팔로잉 목록 조회
export const getFollowings = (userId: number) =>
  getAPIResponseData<FollowingData[]>({
    url: "/user/following",
    method: "GET",
    params: { userId },
  });

// 팔로우
export const postFollow = (userId: number) =>
  getAPIResponseData({
    url: "/user/follow",
    method: "POST",
    params: { userId },
  });

// 언팔로우
export const postUnfollow = (userId: number) =>
  getAPIResponseData({
    url: "/user/unfollow",
    method: "POST",
    params: { userId },
  });

// 탈퇴
export const deleteUser = () =>
  getAPIResponseData({
    url: "/user/withdraw",
    method: "POST",
    data: {},
  });
