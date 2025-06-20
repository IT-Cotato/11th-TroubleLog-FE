export const KAKAO_CLIENT_ID = import.meta.env.VITE_APP_REST_API_KEY;
export const KAKAO_REDIRECT_URI = import.meta.env.VITE_APP_REDIRECT_URI;
export const KAKAO_BASE_URL = "https://kaout.kakao.com/oauth/token";
export const KAKAO_AUTH_URL = `https://kaout.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_url=${KAKAO_REDIRECT_URI}&response_type_code`;
