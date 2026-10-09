import { DrinkIcon, type IconSpec } from "@/components/DrinkIcon";

// 写真があれば写真、なければカテゴリのアイコン(仕様書 §6.5)
export function DrinkImage({
  url,
  icon,
  size,
  rounded = "rounded-lg",
  alt = "",
}: {
  url: string | null | undefined;
  icon: IconSpec;
  size: number;
  rounded?: string;
  alt?: string;
}) {
  if (!url) {
    return (
      <span className={`block shrink-0 overflow-hidden ${rounded}`} style={{ width: size, height: size }}>
        <DrinkIcon {...icon} size={size} />
      </span>
    );
  }
  return (
    // 署名付きURL(1時間で切れる)なので next/image の最適化は使わない
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 bg-(--color-bg) object-cover ${rounded}`}
      style={{ width: size, height: size }}
    />
  );
}
