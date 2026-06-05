import { cls } from "../lib/helpers";
import { TONE } from "../lib/labels";

export function StatusPill({ value, label }: { value: string; label: string }) {
  return <span className={cls("pill", TONE[value] || "pill-neutral")}>{label}</span>;
}
