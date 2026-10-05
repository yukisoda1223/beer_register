import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  // 読み込めないときは globals.css に書いた端末のゴシック体で表示する
  fallback: ["Hiragino Sans", "Yu Gothic", "Meiryo", "sans-serif"],
});

export const metadata: Metadata = {
  title: "のみくらべ帳",
  description: "ビールと日本酒の飲み比べを記録するアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F28C28",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" data-theme="beer" className={`${notoSansJP.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
