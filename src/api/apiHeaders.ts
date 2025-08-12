export const getEnvType = () => import.meta.env.VITE_ENV_TYPE ?? "local";

type AuthHeaderOptions = {
  includeFixedToken?: boolean; // true면 고정 토큰을 시도
};

export const getAuthHeaders = (opts: AuthHeaderOptions = {}) => {
  const headers: Record<string, string> = { EnvType: getEnvType() };

  if (opts.includeFixedToken) {
    const fixed = import.meta.env.VITE_FIXED_AUTH as string | undefined;
    if (fixed && fixed.trim().length > 0) {
      headers.Authorization = `Bearer ${fixed}`;
    } else {
      console.warn("[Auth] VITE_FIXED_AUTH not set; skip Authorization");
    }
  }

  return headers;
};
