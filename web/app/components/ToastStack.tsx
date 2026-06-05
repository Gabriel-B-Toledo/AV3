import type { Toast } from "../lib/types";

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>{t.msg}</div>
      ))}
    </div>
  );
}
