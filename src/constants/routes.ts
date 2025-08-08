export const MYPAGE_SUBPATH = {
  FOLLOWING: "following",
  FOLLOWER: "follower",
  EDIT_PROFILE: "editprofile",
  STATISTICS: "statistics",
  LIKES: "likes",
};

export const ROUTE = {
  USER: "user",
  HOME: "home",
  SEARCH: "search",
  MYPAGE: "mypage/:id",
  MYPAGE_EDIT: `mypage/:id/${MYPAGE_SUBPATH.EDIT_PROFILE}`,
  FOLLOWING: `mypage/:id/${MYPAGE_SUBPATH.FOLLOWING}`,
  FOLLOWER: `mypage/:id/${MYPAGE_SUBPATH.FOLLOWER}`,
  STATISTICS: `mypage/:id/${MYPAGE_SUBPATH.STATISTICS}`,
  LIKES: `mypage/:id/${MYPAGE_SUBPATH.LIKES}`,

  PROJECT_DETAIL: "project/:id",
  COMMUNITY: "community",
  COMMUNITY_POST: "community/:postId",
};
