import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabs } from "@/components/BottomTabs";
import { ThemeSync } from "@/components/ThemeSync";
import { UnsavedChangesProvider } from "@/components/UnsavedChanges";
import { KINDS, headerKinds, isKind } from "@/lib/kinds";
import { loadKindSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return KINDS.map((kind) => ({ kind }));
}

export default async function KindLayout({ children, params }: LayoutProps<"/[kind]">) {
  const { kind } = await params;
  // 知らない種類の URL は 404 にする
  if (!isKind(kind)) notFound();
  // ヘッダーに出す種類(設定画面の並び順・チェック)
  const settings = await loadKindSettings(await createClient());
  const kinds = headerKinds(settings.order, settings.visible, kind);

  return (
    // data-theme をここにも付けて、最初の表示から正しい色にする
    <div data-theme={kind} className="min-h-dvh bg-(--color-bg) text-(--color-text)">
      <ThemeSync kind={kind} />
      <UnsavedChangesProvider>
        <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col">
          <AppHeader kind={kind} kinds={kinds} />
          <main className="flex-1 px-4 pt-4 pb-24">{children}</main>
          <BottomTabs kind={kind} />
        </div>
      </UnsavedChangesProvider>
    </div>
  );
}
