"use client";

import { useEffect } from "react";
import { LAST_KIND_COOKIE, type Kind } from "@/lib/kinds";


// <html data-theme> と、最後に見ていた kind(cookie)を今の画面に合わせる
export function ThemeSync({ kind }: { kind: Kind }) {
  useEffect(() => {
    document.documentElement.dataset.theme = kind;
    document.cookie = `${LAST_KIND_COOKIE}=${kind}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, [kind]);

  return null;
}
