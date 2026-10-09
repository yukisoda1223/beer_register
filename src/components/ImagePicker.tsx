"use client";

import { useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CropDialog } from "@/components/CropDialog";
import { DrinkImage } from "@/components/DrinkImage";
import type { IconSpec } from "@/components/DrinkIcon";
import { cropToSquare } from "@/lib/image";

// 左上の丸い写真。タップで Take photo / Choose from library / Remove。選んだら正方形に切り抜く
export function ImagePicker({
  url,
  icon,
  onPick,
  onRemove,
  onError,
}: {
  url: string | null;
  icon: IconSpec;
  onPick: (blob: Blob) => void;
  onRemove: () => void;
  onError: (message: string) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cropping, setCropping] = useState<{ file: File; url: string } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) setCropping({ file, url: URL.createObjectURL(file) });
  }

  function closeCrop() {
    if (cropping) URL.revokeObjectURL(cropping.url);
    setCropping(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label={url ? "Change photo" : "Add photo"}
        className="relative shrink-0 rounded-full"
      >
        <DrinkImage url={url} icon={icon} size={72} rounded="rounded-full" />
        <span className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-text-sub)">
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
      </button>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
      <input ref={albumRef} type="file" accept="image/*" hidden onChange={handleFile} />

      <ConfirmDialog
        open={menuOpen}
        title="Photo"
        onClose={() => setMenuOpen(false)}
        actions={[
          { label: "Take photo", variant: "primary", onClick: () => (setMenuOpen(false), cameraRef.current?.click()) },
          { label: "Choose from library", onClick: () => (setMenuOpen(false), albumRef.current?.click()) },
          ...(url ? [{ label: "Remove", variant: "danger" as const, onClick: () => (setMenuOpen(false), onRemove()) }] : []),
          { label: "Cancel", onClick: () => setMenuOpen(false) },
        ]}
      />

      {cropping && (
        <CropDialog
          imageUrl={cropping.url}
          onCancel={closeCrop}
          onDone={async (area) => {
            try {
              onPick(await cropToSquare(cropping.file, area));
            } catch {
              onError("This photo could not be loaded. Try another one.");
            }
            closeCrop();
          }}
        />
      )}
    </>
  );
}
