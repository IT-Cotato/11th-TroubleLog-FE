export const getOriginSafely = (maybeUrl?: string | null): string => {
  try {
    if (maybeUrl && /^https?:\/\//i.test(maybeUrl)) {
      return new URL(maybeUrl).origin;
    }
  } catch {
    // invalid URL → fall back
    return window.location.origin;
  }
  return window.location.origin;
};

export const isAbsoluteUrl = (url?: string) =>
  !!url && /^https?:\/\//i.test(url);
