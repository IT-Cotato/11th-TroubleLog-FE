export const getAuthHeaders = () => ({
  Authorization: `Bearer ${import.meta.env.VITE_FIXED_AUTH}`,
  EnvType: import.meta.env.VITE_ENV_TYPE,
});
