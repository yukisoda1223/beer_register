"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

// 写真を正方形(1:1)に切り抜くダイアログ。ドラッグで位置、スライダー(またはピンチ)で拡大
export function CropDialog({
  imageUrl,
  onCancel,
  onDone,
}: {
  imageUrl: string;
  onCancel: () => void;
  onDone: (area: Area) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => (e.preventDefault(), onCancel())}
      aria-label="Crop photo"
      className="m-auto w-[min(92vw,420px)] rounded-2xl bg-(--color-surface) p-4 text-(--color-text) shadow-lg backdrop:bg-black/50"
    >
      <h2 className="text-[15px] font-medium">Crop photo</h2>
      <div className="relative mt-3 aspect-square w-full overflow-hidden rounded-xl bg-black">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={1}
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>
      <input
        type="range"
        min={1}
        max={3}
        step={0.01}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        aria-label="Zoom"
        className="mt-3 h-8 w-full accent-(--color-primary)"
      />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onCancel} className="min-h-10 flex-1 rounded-full border border-(--color-border) text-[13px] font-medium">
          Cancel
        </button>
        <button
          type="button"
          disabled={!area}
          onClick={() => area && onDone(area)}
          className="min-h-10 flex-1 rounded-full bg-(--color-primary) text-[13px] font-medium text-(--color-on-primary) disabled:opacity-50"
        >
          Use photo
        </button>
      </div>
    </dialog>
  );
}
