import { cls } from "../lib/helpers";
import { TONE } from "../lib/labels";

// Recebe o valor do enum (para a cor) e o rótulo já traduzido (para exibição).
export function StatusPill({ value, label }: { value: string; label: string }) {
  return <span className={cls("pill", TONE[value] || "pill-neutral")}>{label}</span>;
}
