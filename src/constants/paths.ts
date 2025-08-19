export const PATH = {
  ROOT: "/",
  LOGIN: "/",
  SIGNUP: "/signup",
  SIGNUP_DETAIL: "/signup/detail",
  SIGNUP_OAUTH: "/signup/oauth",
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
  PREVIEW: (postId: number, summaryId?: number | string) =>
    summaryId != null
      ? `/troubles/${postId}?summaryId=${summaryId}`
      : `/troubles/${postId}`,
  PREVIEW_ROUTE: "/troubles/:postId",

  POST_SUMMARY: (summaryId: string | number) => `/post/summary/${summaryId}`,
  POST_SUMMARY_ROUTE: "/post/summary/:summaryId",
  NOT_FOUND: "/404",
  AUTH_GUARD: "/auth-required",

  COMBINED_DETAIL: (postId?: string | number, summaryId?: string | number) =>
    postId && summaryId
      ? `/troubles/${postId}/combine/${summaryId}`
      : "/troubles/:postId/combine/:summaryId",
};
