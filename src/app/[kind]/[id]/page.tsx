import Link from "next/link";
import { DeleteButton } from "@/components/DeleteButton";
import { DrinkImage } from "@/components/DrinkImage";
import { StarDisplay } from "@/components/StarDisplay";
import { formatDateLong, iconOf, originLabel, type Drink } from "@/lib/drink";
import { loadDrinkOr404 } from "@/lib/drinks-server";
import { SERVING_TEMP_LABELS } from "@/lib/masters";

// 記録の詳細(見るだけ)。下の Edit / Delete から変更できる
export default async function DrinkDetailPage({ params }: PageProps<"/[kind]/[id]">) {
  const { kind: kindParam, id } = await params;
  const { drink, imageUrl, history } = await loadDrinkOr404(kindParam, id);
  const kind = drink.kind;
  const origin = originLabel(drink);

  return (
    <div className="flex flex-col gap-4">
      {drink.status === "draft" && (
        <p className="self-start rounded-full bg-(--color-primary-soft) px-3 py-1 text-[12px] text-(--color-accent-text)">Draft</p>
      )}

      <div className="flex items-center gap-4">
        <DrinkImage url={imageUrl} icon={iconOf(drink)} size={88} rounded="rounded-full" alt={drink.name} />
        <div className="min-w-0">
          <h1 className="text-[20px] leading-snug font-medium tracking-tight">{drink.name}</h1>
          <p className="mt-0.5 text-[13px] text-(--color-text-sub)">
            {[drink.category, origin].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <Block title="Rating">
        <StarRow label="Overall" value={drink.rating} large />
        {kind === "beer" && <StarRow label="Bitterness" value={drink.bitterness} />}
        <StarRow label="Aroma" value={drink.aroma} />
        {kind === "sake" && (
          <>
            <ScaleRow label="Sweet — Dry" left="Sweet" right="Dry" value={drink.sweet_dry} />
            <ScaleRow label="Light — Rich" left="Light" right="Rich" value={drink.light_rich} />
            <TextRow label="Served" value={drink.serving_temp && SERVING_TEMP_LABELS[drink.serving_temp]} />
          </>
        )}
        <TextRow label="Date" value={formatDateLong(drink.drunk_on)} />
      </Block>

      <Block title="Drink">
        <TextRow label="Brewery" value={drink.maker} />
        <TextRow label="Origin" value={origin} />
        <TextRow label="Address" value={drink.maker_address} />
        <TextRow label="ABV" value={drink.abv != null ? `${drink.abv}%` : null} />
        {kind === "sake" && <SakeRows drink={drink} />}
        <TextRow label="Price" value={priceText(drink)} />
      </Block>

      {drink.comment && (
        <Block title="Notes">
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{drink.comment}</p>
        </Block>
      )}

      {history.length > 0 && (
        <Block title={`Also tasted · ${history.length}×`}>
          <ul className="flex flex-col divide-y divide-(--color-border)">
            {history.map((h) => (
              <li key={h.id}>
                <Link href={`/${kind}/${h.id}`} className="flex min-h-11 items-center justify-between gap-3 text-[13px]">
                  <span className="text-(--color-text-sub)">
                    {formatDateLong(h.drunk_on)}
                    {h.status === "draft" && " · Draft"}
                  </span>
                  {h.rating != null && <StarDisplay value={h.rating} size={12} />}
                </Link>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {drink.sources.length > 0 && (
        <details className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-[13px]">
          <summary className="cursor-pointer text-(--color-text-sub)">Sources ({drink.sources.length})</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {drink.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-(--color-accent-text) underline underline-offset-2">
                  {s.title || s.url}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-1 flex items-center justify-end gap-2">
        <DeleteButton kind={kind} id={drink.id} productId={drink.product_id} name={drink.name} imagePath={drink.image_path} />
        <Link
          href={`/${kind}/${drink.id}/edit`}
          className="flex min-h-10 items-center rounded-full bg-(--color-primary) px-5 text-[13px] font-medium text-(--color-on-primary)"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
      <h2 className="mb-2 text-[11px] font-medium tracking-[0.1em] text-(--color-text-sub) uppercase">{title}</h2>
      <dl className="flex flex-col gap-1.5">{children}</dl>
    </section>
  );
}

function SakeRows({ drink }: { drink: Drink }) {
  return (
    <>
      <TextRow label="Polishing" value={drink.polish_ratio != null ? `${drink.polish_ratio}%` : null} />
      <TextRow label="SMV" value={drink.sake_meter != null ? signed(drink.sake_meter) : null} />
      <TextRow label="Acidity" value={drink.acidity?.toString()} />
      <TextRow label="Rice" value={drink.rice} />
    </>
  );
}

function priceText(d: Drink) {
  if (d.price_yen == null) return d.price_note;
  const yen = `¥${d.price_yen.toLocaleString("en-US")}`;
  return d.price_note ? `${yen} (${d.price_note})` : yen;
}

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

const ROW = "flex min-h-7 items-center justify-between gap-4";

// 値が無い項目は行ごと出さない
function TextRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className={ROW}>
      <dt className="shrink-0 text-[12px] text-(--color-text-sub)">{label}</dt>
      <dd className="text-right text-[14px]">{value}</dd>
    </div>
  );
}

function StarRow({ label, value, large }: { label: string; value: number | null; large?: boolean }) {
  if (value == null) return null;
  return (
    <div className={ROW}>
      <dt className="text-[12px] text-(--color-text-sub)">{label}</dt>
      <dd>
        <StarDisplay value={value} size={large ? 18 : 14} />
      </dd>
    </div>
  );
}

function ScaleRow({ label, left, right, value }: { label: string; left: string; right: string; value: number | null }) {
  if (value == null) return null;
  return (
    <div className={ROW}>
      <dt className="shrink-0 text-[12px] text-(--color-text-sub)">{label}</dt>
      <dd className="flex items-center gap-2 text-[12px] text-(--color-text-sub)" aria-label={`${value} on a scale from ${left} (1) to ${right} (5)`}>
        <span>{left}</span>
        <span className="flex gap-1" aria-hidden>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`size-2.5 rounded-full ${i === value ? "bg-(--color-primary)" : "bg-(--color-border)"}`} />
          ))}
        </span>
        <span>{right}</span>
      </dd>
    </div>
  );
}
