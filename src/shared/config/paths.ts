export const PATH = {
  LANDING: "/",
  ROOT: "/login",
  LOGIN: "/login",
  SIGNUP: "/signup",
  SIGNUP_DETAIL: "/signup/detail",
  SIGNUP_OAUTH: "/signup/oauth",
  OAUTH_REGISTER: "/auth/oauth-register",

  USER: "/user",
  HOME: "/user/home",
  SEARCH: "/user/search",

  // 동적 세그먼트는 콜백 형태로만 제공(한 곳에서 관리)
  MYPAGE: (id = ":id") => `/user/mypage/${id}`,
  MYPAGE_EDIT: (id = ":id") => `/user/mypage/${id}/editprofile`,
  PROJECT_DETAIL: (id = ":id") => `/user/project/${id}`,

  COMMUNITY: "/user/community",
  COMMUNITY_POST: (postId = ":postId") => `/user/community/${postId}`,

  TEMP_WRITING: "/tempwriting",
  FREEFORM_WRITING: "/freeformwriting",

  PREVIEW: (postId: string | number, summaryId?: string | number) =>
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
} as const;
