import type { MetadataRoute } from "next";

// ホーム画面に追加したときの名前・アイコン・色(PWA)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "のみくらべノート",
    short_name: "のみくらべ",
    description: "飲んだお酒を記録して、のみくらべるノート。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8F7F4",
    theme_color: "#F8F7F4",
    lang: "ja",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
