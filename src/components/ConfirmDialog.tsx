"use client";

import { useEffect, useRef } from "react";

export type DialogAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "danger" | "plain";
};

const VARIANT: Record<NonNullable<DialogAction["variant"]>, string> = {
  primary: "bg-(--color-primary) text-(--color-on-primary)",
  danger: "bg-red-700 text-white",
  plain: "border border-(--color-border) text-(--color-text)",
};

// 確認ダイアログ。actions は表示する順(縦に並ぶ)。Esc や外側のタップは onClose
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

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(90vw,360px)] rounded-xl bg-(--color-surface) p-5 text-(--color-text) shadow-xl backdrop:bg-black/40"
    >
      <h2 id="confirm-title" className="text-lg font-bold">
        {title}
      </h2>
      {message && <p className="mt-2 text-(--color-text-sub)">{message}</p>}
      <div className="mt-5 flex flex-col gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className={`min-h-11 rounded-xl font-bold ${VARIANT[a.variant ?? "plain"]}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </dialog>
  );
}
