import { LagerAle } from "@/components/learn/LagerAle";
import { LearnSection } from "@/components/learn/LearnSection";
import { StyleShelf } from "@/components/learn/StyleShelf";
import { StyleTree } from "@/components/learn/StyleTree";
import { KIND_LABELS, type Kind } from "@/lib/kinds";
import { createClient } from "@/lib/supabase/server";

// ③Learn。いまはビールだけ。ほかの種類は準備中
export default async function LearnPage({ params }: PageProps<"/[kind]/learn">) {
  const kind = (await params).kind as Kind;

  if (kind !== "beer") {
    return (
      <div className="flex flex-col gap-4">
        <LearnHeader title={`${KIND_LABELS[kind]} を知る`} />
        <section className="rounded-[24px] border border-(--color-border) bg-(--color-surface) px-5 py-10 text-center">
          <p className="text-[10px] tracking-[0.2em] text-(--color-text-sub)">COMING SOON</p>
          <p className="mt-2 text-[15px] font-light tracking-wide">{KIND_LABELS[kind]} の Learn は準備中です</p>
        </section>
      </div>
    );
  }

  // 記録したスタイルごとの杯数(系統樹に出す)
  const supabase = await createClient();
  const { data } = await supabase.from("drink_records").select("category").eq("kind", "beer").eq("status", "saved");
  const counts: Record<string, number> = {};
  for (const r of data ?? []) if (r.category) counts[r.category] = (counts[r.category] ?? 0) + 1;

  return (
    <div className="flex flex-col gap-4">
      <LearnHeader title="ビールを知る" />
      <LearnSection no="01" label="Lager & Ale" title="ラガーとエール">
        <LagerAle />
      </LearnSection>
      <LearnSection no="02" label="Family Tree" title="系統樹">
        <StyleTree counts={counts} />
      </LearnSection>
      <LearnSection no="03" label="Styles" title="スタイル図鑑">
        <StyleShelf />
      </LearnSection>
    </div>
  );
}

function LearnHeader({ title }: { title: string }) {
  return (
    <div className="px-1 pt-1">
      <p className="text-[10px] tracking-[0.2em] text-(--color-text-sub)">LEARN</p>
      <h1 className="mt-1 text-[24px] font-light tracking-wide">{title}</h1>
    </div>
  );
}
