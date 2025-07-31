import type { FollowingData, ProfileData } from "@/models/user.model";
import getAPIResponseData from "../utils/getAPIResponseData";

// 내 프로필 조회
export const getMyProfile = () =>
  getAPIResponseData<ProfileData>({
    url: "/user",
    method: "GET",
  });

// 사용자 정보 조회
export const getUserInfo = (userId: string) =>
  getAPIResponseData<ProfileData>({
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

// 팔로우
export const postFollow = () =>
  getAPIResponseData({
    url: "/user/follow",
    method: "POST",
    data: {},
  });

// 팔로워 목록 조회
export const getFollowers = () =>
  getAPIResponseData<FollowingData[]>({
    url: "/user/follower",
    method: "GET",
  });

// 팔로잉 목록 조회
export const getFollowings = () =>
  getAPIResponseData<FollowingData[]>({
    url: "/user/following",
    method: "GET",
  });

// 언팔로우
export const postUnfollow = () =>
  getAPIResponseData({
    url: "/user/unfollow",
    method: "POST",
    data: {},
  });

// 탈퇴
export const deleteUser = () =>
  getAPIResponseData({
    url: "/user/withdraw",
    method: "POST",
    data: {},
  });
