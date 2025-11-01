export const PATH = {
  LANDING: "/",
  ROOT: "/login",
  LOGIN: "/login",
  SIGNUP: "/signup",
  SIGNUP_DETAIL: "/signup/detail",
  TERMS: "/signup/terms",
  SIGNUP_OAUTH: "/signup/oauth",
  OAUTH_REGISTER: "/auth/oauth-register",

  USER: "/user",
  HOME: "/user/home",
  SEARCH: "/user/search",

  // 마이페이지: 내 페이지(무 id) / 타인 페이지(id 포함) 분리
  MYPAGE_BASE: "/user/mypage", // 내 마이페이지
  MYPAGE_ID: (id = ":id") => `/user/mypage/${id}`, // 타인 마이페이지
  MYPAGE_EDIT_ME: "/user/mypage/editprofile", // 내 프로필 편집
  MYPAGE_EDIT: (id = ":id") => `/user/mypage/${id}/editprofile`, // (옵션) 타인 경로 유지 필요시

  // 프로젝트/커뮤니티
  PROJECT_DETAIL: (id = ":id") => `/user/project/${id}`,

  COMMUNITY: "/user/community",
  COMMUNITY_POST_ID: (postId = ":postId") => `/user/community/${postId}`, // 하위 호환
  COMMUNITY_POST_SLUG: (slug = ":slug") => `/user/community/p/${slug}`, // 새 슬러그 경로

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
