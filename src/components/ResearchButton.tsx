"use client";

// 「名前からAIで自動入力」ボタン(仕様書 §8.2)。処理はフォーム側(DrinkForm)で行う
export function ResearchButton({
  loading,
  disabled,
  onClick,
}: {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-(--color-primary) bg-(--color-surface) px-3 text-[15px] font-bold text-(--color-accent-text) disabled:opacity-70"
    >
      {loading ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          調べています…
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" fill="currentColor" />
          </svg>
          名前からAIで自動入力
        </>
      )}
    </button>
  );
}
