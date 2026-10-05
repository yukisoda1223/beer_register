import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabs } from "@/components/BottomTabs";
import { ThemeSync } from "@/components/ThemeSync";
import { KINDS, isKind } from "@/lib/kinds";

// /beer と /sake 以外の URL は 404 にする
export const dynamicParams = false;

export function generateStaticParams() {
  return KINDS.map((kind) => ({ kind }));
}

export default async function KindLayout({ children, params }: LayoutProps<"/[kind]">) {
  const { kind } = await params;
  if (!isKind(kind)) notFound();

  return (
    // data-theme をここにも付けて、最初の表示から正しい色にする
    <div data-theme={kind} className="min-h-dvh bg-(--color-bg) text-(--color-text)">
      <ThemeSync kind={kind} />
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col">
        <AppHeader kind={kind} />
        <main className="flex-1 px-4 pt-4 pb-24">{children}</main>
        <BottomTabs kind={kind} />
      </div>
    </div>
  );
}
