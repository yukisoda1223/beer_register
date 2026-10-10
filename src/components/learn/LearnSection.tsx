import type { ReactNode } from "react";

// Learn の見出し付きのかたまり。紹介カードと同じく、細い線・細めの見出し・番号
export function LearnSection({ no, label, title, children }: { no: string; label: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-(--color-border) bg-(--color-surface) px-5 pt-5 pb-6">
      <div className="flex items-center gap-3">
        <span className="text-[10px] tracking-[0.2em] text-(--color-text-sub) tabular-nums">{no}</span>
        <span className="h-px flex-1 bg-(--color-border)" />
        <span className="text-[10px] tracking-[0.2em] text-(--color-text-sub) uppercase">{label}</span>
      </div>
      <h2 className="mt-4 text-[20px] font-light tracking-wide">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
