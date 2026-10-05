"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const MESSAGES: Record<string, string> = {
  saved: "保存しました",
  draft: "下書きに保存しました",
  deleted: "削除しました",
};

// URL の ?done=saved などを見て、短いお知らせを出す(少したったら URL から消す)
export function Toast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const done = params.get("done");
  const message = done ? MESSAGES[done] : undefined;

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => router.replace(pathname, { scroll: false }), 2500);
    return () => clearTimeout(timer);
  }, [done, pathname, router]);

  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-24 z-30 mx-auto w-fit rounded-full bg-(--color-text) px-5 py-3 text-white shadow-lg"
    >
      {message}
    </div>
  );
}
