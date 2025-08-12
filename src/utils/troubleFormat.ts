// 날짜: ISO → YY.MM.DD
export const formatYYMMDD = (iso: string) => {
  if (!iso) return "";
  // 타임존 영향 최소화를 위해 YYYY-MM-DD만 우선 사용
  const [datePart] = iso.split("T");
  if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [yyyy, mm, dd] = datePart.split("-");
    return `${yyyy.slice(-2)}.${mm}.${dd}`;
  }
  // fallback: 파서에 위임하되 Invalid Date 방어
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yy = String(d.getFullYear()).slice(-2);
  const mm2 = String(d.getMonth() + 1).padStart(2, "0");
  const dd2 = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm2}.${dd2}`;
};
