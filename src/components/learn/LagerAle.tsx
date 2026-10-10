// ラガーとエールの違い。発酵タンクの中で、酵母が沈む(下面)か浮く(上面)かの絵と、並べた比較
const ROWS: { label: string; lager: string; ale: string }[] = [
  { label: "発酵", lager: "下面発酵", ale: "上面発酵" },
  { label: "温度", lager: "低め 約7〜13℃", ale: "高め 約15〜24℃" },
  { label: "熟成", lager: "低温で長め", ale: "短め" },
  { label: "味わい", lager: "すっきり・キレ", ale: "香り豊か・コク" },
  { label: "代表", lager: "Pilsner, Helles", ale: "IPA, Stout, Weizen" },
];

function Tank({ top }: { top: boolean }) {
  // 酵母の粒。上面発酵は上に、下面発酵は下に集まる
  const dots = [
    [16, 8],
    [26, 6],
    [36, 9],
    [21, 13],
    [31, 12],
    [44, 7],
  ];
  return (
    <svg viewBox="0 0 60 64" className="h-20 w-auto" aria-hidden>
      <rect x="4" y="2" width="52" height="58" rx="10" fill="var(--color-bg)" stroke="var(--color-border)" />
      <rect x="8" y="10" width="44" height="46" rx="7" fill="var(--color-primary)" opacity=".35" />
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x - 2} cy={top ? y + 8 : 60 - y - 4} r="2.4" fill="var(--color-accent-text)" />
      ))}
      {/* 泡の粒 */}
      {[18, 30, 42].map((x, i) => (
        <circle key={x} cx={x} cy={26 + i * 7} r="1.4" fill="#fff" opacity=".9" />
      ))}
    </svg>
  );
}

export function LagerAle() {
  return (
    <div>
      <div className="grid grid-cols-[4.5rem_1fr_1fr] items-end gap-x-3">
        <span />
        {[
          { t: "Lager", top: false },
          { t: "Ale", top: true },
        ].map(({ t, top }) => (
          <div key={t} className="flex flex-col items-center gap-2">
            <Tank top={top} />
            <span className="text-[15px] tracking-wide">{t}</span>
          </div>
        ))}
      </div>
      <dl className="mt-3 divide-y divide-(--color-border) border-y border-(--color-border)">
        {ROWS.map((r) => (
          <div key={r.label} className="grid min-h-11 grid-cols-[4.5rem_1fr_1fr] items-center gap-x-3 py-2 text-[13px]">
            <dt className="text-[11px] tracking-wide text-(--color-text-sub)">{r.label}</dt>
            <dd className="text-center">{r.lager}</dd>
            <dd className="text-center">{r.ale}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[12px] leading-relaxed text-(--color-text-sub)">
        ちがいは酵母の種類。ラガー酵母は低温で働いてタンクの下に沈み、エール酵母は高めの温度で働いて上に浮きやすい。どちらでもない野生酵母や乳酸菌を使うビールもある。
      </p>
    </div>
  );
}
