import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  // 読み込めないときは globals.css に書いた端末のゴシック体で表示する
  fallback: ["Hiragino Sans", "Yu Gothic", "Meiryo", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Nomikurabe",
  description: "A personal log of the beer and sake you drink.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F8F7F4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="beer" className={`${inter.variable} ${notoSansJP.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
