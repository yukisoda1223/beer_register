"use client";

import { useEffect } from "react";
import { LAST_KIND_COOKIE, type Kind } from "@/lib/kinds";

const THEME_COLORS: Record<Kind, string> = {
  beer: "#F28C28",
  sake: "#1F2F55",
};

// <html data-theme> と、最後に見ていた kind(cookie)を今の画面に合わせる
export function ThemeSync({ kind }: { kind: Kind }) {
  useEffect(() => {
    document.documentElement.dataset.theme = kind;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[kind]);
    document.cookie = `${LAST_KIND_COOKIE}=${kind}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, [kind]);

  return null;
}
