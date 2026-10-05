// ダミー表示であることを示す帯(M1の見た目確認用)
export function SampleNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-(--color-border) bg-(--color-surface) px-3 py-2 text-[13px] text-(--color-text-sub)">
      {children}
    </p>
  );
}
