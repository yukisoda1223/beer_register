import { SAKE_TYPES } from "@/lib/learn/sake-grades";

// 香りと味の4タイプ。縦が香りの高さ、横が味の濃さ
export function TypeMap() {
  const cell = (aroma: "high" | "low", body: "light" | "rich") => SAKE_TYPES.find((t) => t.aroma === aroma && t.body === body)!;
  const order = [cell("high", "light"), cell("high", "rich"), cell("low", "light"), cell("low", "rich")];
  return (
    <div>
      <div className="grid grid-cols-[1.5rem_1fr] gap-2">
        <div className="flex flex-col items-center justify-between py-1 text-[10px] text-(--color-text-sub)">
          <span>高</span>
          <span>香り</span>
          <span>低</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {order.map((t, i) => (
            <div
              key={t.type}
              className="flex aspect-[4/3] flex-col justify-between rounded-2xl border border-(--color-border) p-3"
              style={{ background: `color-mix(in srgb, var(--color-primary) ${[22, 34, 8, 16][i]}%, var(--color-surface))` }}
            >
              <span className="text-[20px] font-light tracking-widest">{t.type}</span>
              <span>
                <span className="block text-[11px]">{t.note}</span>
                <span className="block text-[10px] text-(--color-text-sub)">{t.examples}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 ml-8 flex justify-between text-[10px] text-(--color-text-sub)">
        <span>軽快</span>
        <span className="tracking-[0.3em]">味</span>
        <span>濃厚</span>
      </div>
    </div>
  );
}
