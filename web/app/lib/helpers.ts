export const cls = (...xs: Array<string | false | null | undefined>): string =>
  xs.filter(Boolean).join(" ");

export const initials = (n = ""): string =>
  n.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

export const fmtDate = (iso: string): string => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "");
};

export const daysUntil = (iso: string): number => {
  const d = new Date(iso);
  const today = new Date();
  return Math.round((d.getTime() - today.getTime()) / 86400000);
};
