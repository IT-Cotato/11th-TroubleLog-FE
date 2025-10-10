import { PATH } from "@/shared/config/paths";
export const isAuthCallbackPath = (p: string) =>
  p.startsWith(PATH.OAUTH_REGISTER);
