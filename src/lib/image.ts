// 写真をアップロードする前にブラウザで整える。正方形(1:1)に切り抜き、一辺最大1280px・WebP にする
const MAX_SIDE = 1280;

export type CropArea = { x: number; y: number; width: number; height: number };

// area は元の写真の上での切り抜き範囲(ピクセル)。省略すると中央を正方形に切り抜く
export async function cropToSquare(file: Blob, area?: CropArea): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const src = area ?? { x: (bitmap.width - side) / 2, y: (bitmap.height - side) / 2, width: side, height: side };
  const out = Math.round(Math.min(MAX_SIDE, src.width));

  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  canvas.getContext("2d")!.drawImage(bitmap, src.x, src.y, src.width, src.height, 0, 0, out, out);
  bitmap.close();

  const webp = await toBlob(canvas, "image/webp", 0.82);
  if (webp?.type === "image/webp") return webp;
  // WebP で書き出せないブラウザ(一部の iPhone など)は JPEG にする
  const jpeg = await toBlob(canvas, "image/jpeg", 0.85);
  if (!jpeg) throw new Error("Could not process the photo");
  return jpeg;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export function extensionOf(blob: Blob) {
  return blob.type === "image/webp" ? "webp" : "jpg";
}
