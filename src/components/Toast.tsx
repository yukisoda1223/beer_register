"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const MESSAGES: Record<string, string> = {
  saved: "Saved",
  draft: "Saved as draft",
  deleted: "Deleted",
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
      className="fixed inset-x-0 bottom-24 z-30 mx-auto w-fit rounded-full bg-(--color-text) px-4 py-2 text-[13px] text-white shadow-lg"
    >
      {message}
    </div>
  );
}
