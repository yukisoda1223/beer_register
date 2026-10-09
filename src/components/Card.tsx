import type { ReactNode } from "react";

export function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-[12px] font-medium tracking-[0.08em] text-(--color-text-sub) uppercase">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
