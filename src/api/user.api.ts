import type {
  FollowingData,
  ProfileData,
  UpdatedProfileData,
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
export const getUserInfo = (userId: number) =>
  getAPIResponseData<UserInfoData>({
    url: `/user/${userId}`,
    method: "GET",
  });

// 프로필 수정
export const patchProfile = (updatedProfile: UpdatedProfileData) =>
  getAPIResponseData({
    url: "/user",
    method: "PATCH",
    data: { updatedProfile },
  });

// 팔로워 목록 조회
export const getFollowers = (targetUserId: number) =>
  getAPIResponseData<FollowingData[]>({
    url: "/user/followers",
    method: "GET",
    params: { targetUserId },
  });

// 팔로잉 목록 조회
export const getFollowings = (targetUserId: number) =>
  getAPIResponseData<FollowingData[]>({
    url: "/user/followings",
    method: "GET",
    params: { targetUserId },
  });

// 팔로우
export const postFollow = (targetUserId: number) =>
  getAPIResponseData({
    url: "/user/follow",
    method: "POST",
    params: { targetUserId },
  });

// 언팔로우
export const postUnfollow = (targetUserId: number) =>
  getAPIResponseData({
    url: "/user/unfollow",
    method: "POST",
    params: { targetUserId },
  });

// 탈퇴
export const deleteUser = () =>
  getAPIResponseData({
    url: "/user",
    method: "DELETE",
  });
