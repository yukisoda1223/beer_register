import { SAKE_TEMPS } from "@/lib/learn/sake-grades";

// 温度の呼び名。左の帯は冷たい(青)→ 熱い(赤)。記録で選べる飲み方(冷酒・常温・ぬる燗・熱燗)の数も出す
const SERVED_JA = { cold: "冷酒", room: "常温", warm: "ぬる燗", hot: "熱燗" } as const;

export function TempScale({ served }: { served: Record<string, number> }) {
  return (
    <div className="grid grid-cols-[0.5rem_1fr] gap-x-4">
      <div className="rounded-full" style={{ background: "linear-gradient(to bottom, #9CC3D5, #D9E6EA 30%, #F1E7D6 45%, #E9A77C 75%, #C8573A)" }} aria-hidden />
      <ol className="divide-y divide-(--color-border)">
        {SAKE_TEMPS.map((t) => {
          const s = t.served;
          return (
            <li key={t.name} className="flex min-h-10 items-center gap-3 py-1.5">
              <span className="w-[5.5rem] text-[14px] tracking-wide whitespace-nowrap">{t.name}</span>
              <span className="flex-1 text-[10px] text-(--color-text-sub)">{t.reading}</span>
              <span className="text-[12px] tabular-nums">{t.temp}</span>
              {s && served[s] ? (
                <span className="rounded-full bg-(--color-primary-soft) px-2 py-0.5 text-[10px] text-(--color-accent-text)">
                  {SERVED_JA[s]} {served[s]}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
