/**
 * 인증 관련 navigation state 타입 정의
 */

/**
 * SignPageOauth로 이동할 때 전달되는 state
 */
export interface SignPageOauthState {
  userId?: number;
  [key: string]: unknown;
}
