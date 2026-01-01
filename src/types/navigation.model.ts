/**
 * React Router location.state 타입 정의
 */

/**
 * CommunityPostDetail로 이동할 때 전달되는 state
 */
export interface CommunityPostDetailState {
  from?: "home" | "community" | "search" | "mypage" | "project";
  ownerId?: number;
  searchScope?: "my" | "community";
  statusFromList?: "inProgress" | "complete" | "created";
  isVisibleFromList?: boolean;
  summaryIdFromList?: number;
  isMineFromList?: boolean;
}

/**
 * React Router Location의 state 타입 (확장 가능)
 */
export type RouterLocationState =
  | CommunityPostDetailState
  | Record<string, unknown>
  | null
  | undefined;
