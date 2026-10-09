"use client";

import { useEffect, useRef } from "react";

export type DialogAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "danger" | "plain";
};

const VARIANT: Record<NonNullable<DialogAction["variant"]>, string> = {
  primary: "bg-(--color-primary) text-(--color-on-primary)",
  danger: "bg-(--color-danger) text-white",
  plain: "border border-(--color-border) text-(--color-text)",
};

// 確認ダイアログ。actions が2つまでなら横並び、それより多ければ縦に並ぶ。Esc や外側のタップは onClose
export function ConfirmDialog({
  open,
  title,
  message,
  actions,
  onClose,
}: {
  open: boolean;
  title: string;
  message?: string;
  actions: DialogAction[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const row = actions.length <= 2;

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(86vw,320px)] rounded-2xl bg-(--color-surface) p-5 text-(--color-text) shadow-lg backdrop:bg-black/30"
    >
      <h2 id="confirm-title" className="text-[15px] font-medium">
        {title}
      </h2>
      {message && <p className="mt-1.5 text-[13px] leading-relaxed text-(--color-text-sub)">{message}</p>}
      <div className={`mt-4 flex gap-2 ${row ? "flex-row-reverse" : "flex-col"}`}>
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className={`min-h-10 rounded-full px-4 text-[13px] font-medium ${row ? "flex-1" : ""} ${VARIANT[a.variant ?? "plain"]}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </dialog>
  );
}
