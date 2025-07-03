export const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
export const KAKAO_REDIRECT_URI = "http://localhost:5173/oauth";
export const KAKAO_BASE_URL = "https://kauth.kakao.com/oauth/token";
export const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_url=${KAKAO_REDIRECT_URI}&response_type_code`;
