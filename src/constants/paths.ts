export const PATH = {
  ROOT: "/",
  LOGIN: "/",
  SIGNUP: "/signup",
  SIGNUP_DETAIL: "/signup/detail",
  OAUTH: "/oauth",

  USER: "/user",
  HOME: "/user/home",
  SEARCH: "/user/search",
  MYPAGE: (id: string) => `/user/mypage/${id}`,
  MYPAGE_EDIT: (id: string) => `/user/mypage/${id}/editprofile`,
  FOLLOWING: (id: string) => `/user/mypage/${id}/following`,
  FOLLOWER: (id: string) => `/user/mypage/${id}/follower`,
  STATISTICS: (id: string) => `/user/mypage/${id}/statistics`,
  LIKES: (id: string) => `/user/mypage/${id}/likes`,
  PROJECT_DETAIL: (id: string) => `/user/project/${id}`,
  COMMUNITY: "/user/community",
  COMMUNITY_POST: (postId: number) => `/user/community/${postId}`,

  TEMP_WRITING: "/tempwriting",
  FREEFORM_WRITING: "/freeformwriting",
  PREVIEW: "/preview",

  NOT_FOUND: "/404",
  AUTH_GUARD: "/auth-required",
};
