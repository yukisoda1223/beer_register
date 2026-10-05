"use client";

import { useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DrinkImage } from "@/components/DrinkImage";
import type { DrinkIconType } from "@/components/DrinkIcon";

// 左上の丸い写真。タップで「撮影する / アルバムから選ぶ / 削除」
export function ImagePicker({
  url,
  icon,
  onPick,
  onRemove,
}: {
  url: string | null;
  icon: DrinkIconType;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPick(file);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={url ? "写真を変更" : "写真を追加"}
        className="relative shrink-0 rounded-full"
      >
        <DrinkImage url={url} icon={icon} size={72} rounded="rounded-full" />
        <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-(--color-primary) text-(--color-on-primary) shadow">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </span>
      </button>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
      <input ref={albumRef} type="file" accept="image/*" hidden onChange={handleFile} />

      <ConfirmDialog
        open={open}
        title="写真"
        onClose={() => setOpen(false)}
        actions={[
          { label: "撮影する", variant: "primary", onClick: () => (setOpen(false), cameraRef.current?.click()) },
          { label: "アルバムから選ぶ", variant: "primary", onClick: () => (setOpen(false), albumRef.current?.click()) },
          ...(url ? [{ label: "削除", variant: "danger" as const, onClick: () => (setOpen(false), onRemove()) }] : []),
          { label: "キャンセル", onClick: () => setOpen(false) },
        ]}
      />
    </>
  );
}
