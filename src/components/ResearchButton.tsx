"use client";

// 「Fill in with AI」ボタン(名前からAIで自動入力、仕様書 §8.2)。処理はフォーム側(DrinkForm)で行う
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
      className="flex min-h-10 items-center justify-center gap-1.5 self-start rounded-full border border-(--color-border) bg-(--color-surface) px-4 text-[13px] font-medium text-(--color-accent-text) disabled:opacity-60"
    >
      {loading ? (
        <>
          <span className="size-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" aria-hidden />
          Looking it up…
        </>
      ) : (
        <>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" fill="currentColor" />
          </svg>
          Fill in with AI
        </>
      )}
    </button>
  );
}
