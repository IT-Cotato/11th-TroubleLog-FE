export const slugify = (s: string) =>
  s
    .normalize("NFC") // 유니코드 정규화
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // 공백 → 하이픈
    // 영문/숫자/밑줄/하이픈/한글만 유지
    .replace(/[^-\w\uAC00-\uD7A3]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, ""); // 앞뒤 하이픈 제거

export const makePostSlug = (title: string, id: string | number) =>
  `${slugify(title)}-${id}`;

export const extractIdFromSlug = (slug: string) => {
  const tail = slug.split("-").pop();
  const n = Number(tail);
  return Number.isFinite(n) ? n : NaN;
};
