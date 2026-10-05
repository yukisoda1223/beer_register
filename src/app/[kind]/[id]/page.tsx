import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { DeleteButton } from "@/components/DeleteButton";
import { DrinkIcon } from "@/components/DrinkIcon";
import { SampleNotice } from "@/components/SampleNotice";
import { StarDisplay } from "@/components/StarDisplay";
import { SERVING_TEMP_LABELS, formatDateLong, iconTypeOf, originLabel, type Drink } from "@/lib/drink";
import { isKind } from "@/lib/kinds";
import { findSampleDrink } from "@/lib/sample";

// 記録の詳細(見るだけ)。一番下の「編集」「削除」から変更できる
export default async function DrinkDetailPage({ params }: PageProps<"/[kind]/[id]">) {
  const { kind, id } = await params;
  if (!isKind(kind)) notFound();
  const drink = findSampleDrink(kind, id);
  if (!drink) notFound();

  return (
    <div className="flex flex-col gap-4">
      <SampleNotice>サンプルの記録です。編集・削除はマイルストーン3で実際に動くようになります。</SampleNotice>

      <div className="flex items-center gap-4">
        <div className="shrink-0 overflow-hidden rounded-full">
          <DrinkIcon type={iconTypeOf(drink)} size={88} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-snug">{drink.name}</h1>
          {drink.category && <p className="mt-1 text-(--color-text-sub)">{drink.category}</p>}
        </div>
      </div>

      <Card title="評価">
        <dl className="flex flex-col gap-2">
          <StarRow label="総合評価" value={drink.rating} large />
          {kind === "beer" && <StarRow label="苦み" value={drink.bitterness} />}
          <StarRow label="香り" value={drink.aroma} />
          {kind === "sake" && (
            <>
              <ScaleRow label="甘口〜辛口" left="甘口" right="辛口" value={drink.sweet_dry} />
              <ScaleRow label="淡麗〜濃醇" left="淡麗" right="濃醇" value={drink.light_rich} />
              <TextRow label="飲んだ温度" value={drink.serving_temp && SERVING_TEMP_LABELS[drink.serving_temp]} />
            </>
          )}
        </dl>
      </Card>

      <Card title="くわしい情報">
        <dl className="flex flex-col gap-2">
          <TextRow label="飲んだ日" value={formatDateLong(drink.drunk_on)} />
          <TextRow label={kind === "beer" ? "醸造所" : "酒蔵"} value={drink.maker} />
          <TextRow label="産地" value={originLabel(drink)} />
          <TextRow label="所在地" value={drink.maker_address} />
          <TextRow label="度数" value={drink.abv != null ? `${drink.abv}%` : null} />
          {kind === "sake" && <SakeRows drink={drink} />}
          <TextRow label="値段" value={priceText(drink)} />
        </dl>
      </Card>

      {drink.comment && (
        <Card title="コメント">
          <p className="whitespace-pre-wrap leading-relaxed">{drink.comment}</p>
        </Card>
      )}

      <div className="mt-2 flex gap-3">
        <Link
          href={`/${kind}/${drink.id}/edit`}
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-(--color-primary) font-bold text-(--color-on-primary)"
        >
          編集
        </Link>
        <DeleteButton name={drink.name} listHref={`/${kind}/list`} />
      </div>
    </div>
  );
}

function SakeRows({ drink }: { drink: Drink }) {
  return (
    <>
      <TextRow label="精米歩合" value={drink.polish_ratio != null ? `${drink.polish_ratio}%` : null} />
      <TextRow label="日本酒度" value={drink.sake_meter != null ? signed(drink.sake_meter) : null} />
      <TextRow label="酸度" value={drink.acidity?.toString()} />
      <TextRow label="酒米" value={drink.rice} />
    </>
  );
}

function priceText(d: Drink) {
  if (d.price_yen == null) return d.price_note;
  const yen = `${d.price_yen.toLocaleString("ja-JP")}円`;
  return d.price_note ? `${yen}(${d.price_note})` : yen;
}

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

const ROW = "flex min-h-8 items-center justify-between gap-4";

// 値が無い項目は行ごと出さない
function TextRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className={ROW}>
      <dt className="shrink-0 text-[13px] text-(--color-text-sub)">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function StarRow({ label, value, large }: { label: string; value: number | null; large?: boolean }) {
  if (value == null) return null;
  return (
    <div className={ROW}>
      <dt className="text-[13px] text-(--color-text-sub)">{label}</dt>
      <dd>
        <StarDisplay value={value} size={large ? 22 : 16} />
      </dd>
    </div>
  );
}

function ScaleRow({ label, left, right, value }: { label: string; left: string; right: string; value: number | null }) {
  if (value == null) return null;
  return (
    <div className={ROW}>
      <dt className="shrink-0 text-[13px] text-(--color-text-sub)">{label}</dt>
      <dd className="flex items-center gap-2 text-[13px]" aria-label={`${left}1〜${right}5のうち${value}`}>
        <span>{left}</span>
        <span className="flex gap-1" aria-hidden>
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`size-3 rounded-full ${i === value ? "bg-(--color-secondary)" : "bg-(--color-border)"}`}
            />
          ))}
        </span>
        <span>{right}</span>
      </dd>
    </div>
  );
}
