"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ImagePicker } from "@/components/ImagePicker";
import { QuickInputSheet } from "@/components/QuickInputSheet";
import { ResearchButton } from "@/components/ResearchButton";
import { Slider5 } from "@/components/Slider5";
import { StarRating } from "@/components/StarRating";
import { useRegisterLeaveGuard } from "@/components/UnsavedChanges";
import { applyQuickInput } from "@/lib/ai/apply-quick-input";
import { applyCandidate } from "@/lib/ai/apply-research";
import { postAi } from "@/lib/ai/fetch-client";
import type { QuickInput } from "@/lib/ai/quick-input-schema";
import type { ResearchCandidate, ResearchResult } from "@/lib/ai/research-schema";
import { iconOf, type Drink } from "@/lib/drink";
import {
  drinkPayload,
  emptyFormValues,
  formValuesFromDrink,
  validateDrinkForm,
  type DrinkFormErrors,
  type DrinkFormField,
  type DrinkFormValues,
} from "@/lib/drink-form";
import { IMAGE_BUCKET, errorMessage } from "@/lib/drinks-db";
import { geocodeOnClient, locationKey } from "@/lib/geo/client";
import { extensionOf } from "@/lib/image";
import type { Kind } from "@/lib/kinds";
import { KIND_CONFIG } from "@/lib/kind-config";
import { BEER_FAMILY_LABELS, COUNTRY_SUGGESTIONS, PREFECTURES, SERVED_OPTIONS, beerFamilyOf } from "@/lib/masters";
import { normalizeName } from "@/lib/normalize";
import { deleteTasting, findKnownProduct, saveDrink } from "@/lib/save-drink";
import { createClient } from "@/lib/supabase/client";

// AIが埋めた項目の一覧(各入力欄の「AI」バッジ用)
const AiFilledContext = createContext<string[]>([]);

type ImageState =
  | { type: "keep" }
  | { type: "new"; blob: Blob; previewUrl: string }
  | { type: "remove" };

type Status = "draft" | "saved";

// フォームの中身のうち、保存するもの一式
type Snapshot = { values: DrinkFormValues; aiFilled: string[]; sources: Drink["sources"] };

type ResearchResponse = ResearchResult & { cached: boolean };

// データベースに保存済みの内容のうち、保存のしかたに関わるもの
type SavedState = {
  status: Status;
  productId: string;
  image_path: string | null;
  lat: number | null;
  lng: number | null;
  // 緯度経度を調べたときの「所在地|地域|国」
  locationKey: string;
};

// 銘柄の情報の欄(前に飲んだ銘柄から入れる対象)
const PRODUCT_FIELDS = [
  "category", "abv", "price_yen", "price_note", "maker", "maker_address", "country", "region",
  "polish_ratio", "sake_meter", "acidity", "ingredient", "age_years", "cask", "peat", "vintage",
] as const;

function mergeSources(prev: Drink["sources"], add: Drink["sources"]) {
  const urls = new Set(prev.map((s) => s.url));
  return [...prev, ...add.filter((s) => !urls.has(s.url))];
}

// エラーがあったとき、画面の上から順に最初の欄へスクロールする
const FIELD_ORDER: DrinkFormField[] = [
  "name", "category", "drunk_on", "abv", "polish_ratio", "sake_meter", "acidity", "price_yen", "rating",
];

// 記録画面(新規・編集で共通のフォーム)
export function DrinkForm({ kind, drink, imageUrl }: { kind: Kind; drink?: Drink; imageUrl?: string | null }) {
  const router = useRouter();
  const initialValues = useMemo(() => (drink ? formValuesFromDrink(drink) : emptyFormValues(kind)), [drink, kind]);
  const [values, setValues] = useState<DrinkFormValues>(initialValues);
  const [errors, setErrors] = useState<DrinkFormErrors>({});
  const [image, setImage] = useState<ImageState>({ type: "keep" });
  const [saving, setSaving] = useState<Status | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newId] = useState(() => crypto.randomUUID());
  // AIが埋めた項目(「AI」バッジを出す)と、AIが参考にしたページ
  const [aiFilled, setAiFilled] = useState<string[]>(drink?.ai_filled_fields ?? []);
  const [sources, setSources] = useState<Drink["sources"]>(drink?.sources ?? []);
  // データベースに保存済みの状態(新規でも、チャット入力で下書き保存したあとはここに入る)
  const [record, setRecord] = useState<SavedState | null>(
    drink
      ? {
          status: drink.status,
          productId: drink.product_id,
          image_path: drink.image_path,
          lat: drink.lat,
          lng: drink.lng,
          locationKey: locationKey({ address: drink.maker_address, region: drink.region, country: drink.country }),
        }
      : null,
  );
  // 「未保存の変更があるか」の比較元
  const [baseline, setBaseline] = useState(() => ({ values: initialValues, sources: drink?.sources ?? [] }));
  // AI の処理中(quick=文章の読み取り、research=名前から調査)と、その結果のお知らせ
  const [aiBusy, setAiBusy] = useState<"quick" | "research" | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [choices, setChoices] = useState<ResearchResult | null>(null);
  // 前に飲んだことのある銘柄なら、その回数
  const [knownCount, setKnownCount] = useState<number | null>(null);

  const id = drink?.id ?? newId;
  const isSavedRecord = record?.status === "saved";
  const dirty =
    JSON.stringify(values) !== JSON.stringify(baseline.values) ||
    image.type !== "keep" ||
    JSON.stringify(sources) !== JSON.stringify(baseline.sources);

  // 写真のプレビュー用URLは使い終わったら片付ける
  useEffect(() => {
    if (image.type !== "new") return;
    return () => URL.revokeObjectURL(image.previewUrl);
  }, [image]);

  function set<K extends DrinkFormField>(field: K, value: DrinkFormValues[K]) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    // ユーザーが書き換えたら「AI」バッジを外す
    setAiFilled((f) => (f.includes(field) ? f.filter((x) => x !== field) : f));
  }

  function snapshot(): Snapshot {
    return { values, aiFilled, sources };
  }

  function withCandidate(snap: Snapshot, candidate: ResearchCandidate): Snapshot {
    const r = applyCandidate(kind, snap.values, snap.aiFilled, candidate);
    return { values: r.values, aiFilled: r.aiFilled, sources: mergeSources(snap.sources, candidate.sources) };
  }

  function show(snap: Snapshot) {
    setValues(snap.values);
    setAiFilled(snap.aiFilled);
    setSources(snap.sources);
    setErrors({});
  }

  // 名前を入れ終わったとき: 前に飲んだ銘柄なら、その情報を空いている欄に入れる
  async function handleNameBlur() {
    const key = normalizeName(values.name);
    if (!key) return;
    const known = await findKnownProduct(createClient(), kind, key).catch(() => null);
    if (!known || known.product.id === record?.productId) {
      setKnownCount(null);
      return;
    }
    setKnownCount(known.tastingCount);
    setValues((v) => {
      // 名前は前の記録の書き方(正式名)にそろえる
      const next = { ...v, name: String(known.product.name ?? v.name) };
      for (const f of PRODUCT_FIELDS) {
        const value = known.product[f];
        const empty = next[f] == null || String(next[f]).trim() === "";
        if (empty && value != null && value !== "") (next as Record<string, unknown>)[f] = f === "peat" ? value : String(value);
      }
      return next;
    });
  }

  // 名前からAIで調べる(仕様書 §8.2)。候補が1つならそのまま反映、複数なら選んでもらう
  async function research(snap: Snapshot): Promise<Snapshot> {
    setAiBusy("research");
    const result = await postAi<ResearchResponse>("/api/research", { kind, name: snap.values.name });
    if (result.candidates.length === 0) {
      setMessage("Nothing found. Try a different name, or fill it in by hand.");
      return snap;
    }
    if (result.candidates.length > 1) {
      setChoices(result);
      return snap;
    }
    setInfo(result.cached ? "Filled from an earlier search." : "Filled in by AI.");
    return withCandidate(snap, result.candidates[0]);
  }

  async function handleResearchClick() {
    if (!values.name.trim()) {
      setMessage("Enter a name first.");
      return;
    }
    setMessage(null);
    setInfo(null);
    try {
      show(await research(snapshot()));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setAiBusy(null);
    }
  }

  function handlePickCandidate(candidate: ResearchCandidate) {
    show(withCandidate(snapshot(), candidate));
    setChoices(null);
    setInfo("Filled in by AI.");
  }

  // チャットで入力(仕様書 §8.4): 文章を項目に分け、名前から調べ、新しい記録なら下書きとして保存する
  async function handleQuickInput(text: string): Promise<boolean> {
    setMessage(null);
    setInfo(null);
    setAiBusy("quick");
    try {
      const parsed = await postAi<QuickInput>("/api/quick-input", { kind, text });
      const q = applyQuickInput(values, aiFilled, parsed);
      let snap: Snapshot = { values: q.values, aiFilled: q.aiFilled, sources };
      show(snap);
      if (snap.values.name.trim()) {
        try {
          snap = await research(snap);
          show(snap);
        } catch (e) {
          setMessage(`Your note was read, but the lookup failed: ${(e as Error).message}`);
        }
      }
      if (!snap.values.name.trim()) {
        setInfo("Couldn't find a name in your note. Add one before saving.");
      } else if (!isSavedRecord && (await persist("draft", false, snap))) {
        setInfo("Saved as a draft. Check it, then tap Save.");
      } else if (isSavedRecord) {
        setInfo("Filled in from your note. Check it, then tap Save.");
      }
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    } finally {
      setAiBusy(null);
    }
  }

  // 保存の本体。navigate=false のときは画面を移動しない(戻るボタンの確認・チャット入力から呼ぶとき)
  async function persist(status: Status, navigate: boolean, snap: Snapshot = snapshot()): Promise<boolean> {
    const found = validateDrinkForm(kind, snap.values, status);
    setErrors(found);
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) {
      const el = document.getElementById(`field-${first}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return false;
    }

    setSaving(status);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getClaims();
      const userId = auth?.claims.sub;
      if (!userId) throw new Error("not logged in");

      let imagePath = record?.image_path ?? null;
      if (image.type === "new") {
        const path = `${userId}/${id}.${extensionOf(image.blob)}`;
        const { error } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(path, image.blob, { upsert: true, contentType: image.blob.type });
        if (error) throw error;
        if (imagePath && imagePath !== path) await supabase.storage.from(IMAGE_BUCKET).remove([imagePath]);
        imagePath = path;
      } else if (image.type === "remove" && imagePath) {
        await supabase.storage.from(IMAGE_BUCKET).remove([imagePath]);
        imagePath = null;
      }

      const { product, tasting } = drinkPayload(kind, snap.values, status);

      // 地図のピン用に、場所が変わったとき(または未取得のとき)だけ緯度経度を調べる(仕様書 §8.5)
      const place = { address: product.maker_address, region: product.region, country: product.country };
      const key = locationKey(place);
      let position = record && record.locationKey === key && record.lat != null ? { lat: record.lat, lng: record.lng } : null;
      if (!position) position = await geocodeOnClient(place);

      const { productId } = await saveDrink(supabase, {
        tastingId: id,
        currentProductId: record?.productId ?? null,
        product: {
          ...product,
          lat: position?.lat ?? null,
          lng: position?.lng ?? null,
          ai_filled_fields: snap.aiFilled,
          sources: snap.sources,
        },
        tasting: { ...tasting, image_path: imagePath },
      });

      if (navigate) {
        router.push(status === "saved" ? `/${kind}/list?done=saved` : `/${kind}/drafts?done=draft`);
        router.refresh();
      } else {
        // この画面に残るので、保存した状態を「変更なし」の基準にする
        setRecord({ status, productId, image_path: imagePath, lat: position?.lat ?? null, lng: position?.lng ?? null, locationKey: key });
        setImage({ type: "keep" });
        setBaseline({ values: snap.values, sources: snap.sources });
      }
      return true;
    } catch {
      setMessage(errorMessage("Couldn't save. Please try again."));
      return false;
    } finally {
      setSaving(null);
    }
  }

  async function handleDeleteDraft() {
    if (!record) return;
    setConfirmDelete(false);
    setSaving("delete");
    try {
      await deleteTasting(createClient(), { tastingId: id, productId: record.productId, imagePath: record.image_path });
      router.push(`/${kind}/drafts?done=deleted`);
      router.refresh();
    } catch {
      setMessage(errorMessage("Couldn't delete. Please try again."));
      setSaving(null);
    }
  }

  useRegisterLeaveGuard(
    {
      isDirty: () => dirty && saving == null,
      save: () => persist(isSavedRecord ? "saved" : "draft", false),
      saveLabel: isSavedRecord ? "Save" : "Save draft",
      title: isSavedRecord ? "Save your changes?" : "Save as a draft?",
    },
    dirty,
  );

  const previewUrl = image.type === "new" ? image.previewUrl : image.type === "remove" ? null : (imageUrl ?? null);
  const config = KIND_CONFIG[kind];
  const servedOptions = SERVED_OPTIONS[kind];
  const icon = iconOf({ kind, beer_family: beerFamilyOf(values.category), category: values.category, peat: values.peat });
  const busy = saving != null || aiBusy != null;
  const isJapan = values.country.trim().toLowerCase() === "japan";

  return (
    <AiFilledContext.Provider value={aiFilled}>
      <form className="flex flex-col gap-5" onSubmit={(e) => (e.preventDefault(), persist("saved", true))} noValidate>
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-medium tracking-tight">{drink ? "Edit" : "New entry"}</h1>
          <QuickInputSheet kind={kind} busy={aiBusy} onSubmit={handleQuickInput} />
        </div>

        {/* 写真と商品名 */}
        <div className="flex items-start gap-4">
          <ImagePicker
            url={previewUrl}
            icon={icon}
            onPick={(blob) => setImage({ type: "new", blob, previewUrl: URL.createObjectURL(blob) })}
            onRemove={() => setImage(record?.image_path ? { type: "remove" } : { type: "keep" })}
            onError={setMessage}
          />
          <Field label="Name" field="name" error={errors.name} required className="flex-1">
            <textarea
              id="field-name"
              rows={2}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={handleNameBlur}
              placeholder={config.namePlaceholder}
              className={inputClass(errors.name)}
            />
            {knownCount != null && knownCount > 0 && (
              <p className="text-[12px] text-(--color-accent-text)">
                Tasted before · {knownCount}× — details filled from your earlier entry
              </p>
            )}
            <ResearchButton loading={aiBusy === "research"} disabled={busy} onClick={handleResearchClick} />
            {info && <p className="text-[12px] text-(--color-text-sub)">{info}</p>}
          </Field>
        </div>

        <Section title="Rating">
          <Field label="Overall" field="rating" error={errors.rating} required>
            <StarRating id="field-rating" label="Overall" value={values.rating} onChange={(v) => set("rating", v)} invalid={!!errors.rating} />
          </Field>
          {config.stars.map((st) => (
            <Field key={st.field} label={st.label} field={st.field}>
              <StarRating label={st.label} value={values[st.field]} onChange={(v) => set(st.field, v)} size={26} />
            </Field>
          ))}
          <Field label="Aroma" field="aroma">
            <StarRating label="Aroma" value={values.aroma} onChange={(v) => set("aroma", v)} size={26} />
          </Field>
          {config.scales.map((sc) => (
            <Field key={sc.field} label={sc.label} field={sc.field}>
              <Slider5 label={sc.label} left={sc.left} right={sc.right} value={values[sc.field]} onChange={(v) => set(sc.field, v)} />
            </Field>
          ))}
          {servedOptions && (
            <Field label={config.servedLabel ?? "Served"} field="served">
              <ChoiceRow
                label={config.servedLabel ?? "Served"}
                options={servedOptions}
                value={values.served}
                onChange={(v) => set("served", v as DrinkFormValues["served"])}
              />
            </Field>
          )}
        </Section>

        <Section title="Drink">
          <Field label={config.categoryLabel} field="category" error={errors.category} required={config.categoryRequired}>
            <select
              id="field-category"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputClass(errors.category)}
            >
              <option value="">Choose…</option>
              {config.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {kind === "beer" && values.category && (
              <p className="text-[12px] text-(--color-text-sub)">{BEER_FAMILY_LABELS[beerFamilyOf(values.category)!]}</p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <NumberField label="ABV" unit="%" field="abv" values={values} errors={errors} set={set} />
            {config.numbers.map((n) => (
              <NumberField
                key={n.field}
                label={n.label}
                unit={n.unit}
                field={n.field}
                values={values}
                errors={errors}
                set={set}
                integer={n.integer}
                placeholder={n.placeholder}
              />
            ))}
          </div>

          {config.ingredient && (
            <Field label={config.ingredient.label} field="ingredient">
              <input
                id="field-ingredient"
                value={values.ingredient}
                onChange={(e) => set("ingredient", e.target.value)}
                placeholder={config.ingredient.placeholder}
                className={inputClass()}
              />
            </Field>
          )}

          {config.cask && (
            <Field label="Cask" field="cask">
              <select id="field-cask" value={values.cask} onChange={(e) => set("cask", e.target.value)} className={inputClass()}>
                <option value="">Choose…</option>
                {config.cask.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {config.peat && (
            <Field label="Peat" field="peat">
              <ChoiceRow
                label="Peat"
                options={config.peat.map((p) => ({ value: p.value, label: p.label }))}
                value={values.peat}
                onChange={(v) => set("peat", v as DrinkFormValues["peat"])}
              />
            </Field>
          )}

          <div className="grid grid-cols-[1fr_1.3fr] gap-3">
            <NumberField label="Price" unit="¥" field="price_yen" values={values} errors={errors} set={set} integer />
            <Field label="Size" field="price_note">
              <input
                id="field-price_note"
                value={values.price_note}
                onChange={(e) => set("price_note", e.target.value)}
                placeholder={config.sizePlaceholder}
                className={inputClass()}
              />
            </Field>
          </div>
        </Section>

        <Section title="Origin">
          <Field label={config.makerLabel} field="maker">
            <input id="field-maker" value={values.maker} onChange={(e) => set("maker", e.target.value)} className={inputClass()} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Country" field="country">
              <input
                id="field-country"
                list="country-suggestions"
                value={values.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="Japan"
                className={inputClass()}
              />
              <datalist id="country-suggestions">
                {COUNTRY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label={isJapan ? "Prefecture" : "Region"} field="region">
              {isJapan ? (
                <select id="field-region" value={values.region} onChange={(e) => set("region", e.target.value)} className={inputClass()}>
                  <option value="">Choose…</option>
                  {PREFECTURES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="field-region"
                  value={values.region}
                  onChange={(e) => set("region", e.target.value)}
                  placeholder="Ontario"
                  className={inputClass()}
                />
              )}
            </Field>
          </div>

          <Field label="Address" field="maker_address" hint="Used for the map pin">
            <input
              id="field-maker_address"
              value={values.maker_address}
              onChange={(e) => set("maker_address", e.target.value)}
              placeholder="City, state"
              className={inputClass()}
            />
          </Field>
        </Section>

        <Section title="Tasting">
          <Field label="Date" field="drunk_on" error={errors.drunk_on} required>
            <input
              id="field-drunk_on"
              type="date"
              value={values.drunk_on}
              onChange={(e) => set("drunk_on", e.target.value)}
              className={inputClass(errors.drunk_on)}
            />
          </Field>
          <Field label="Notes" field="comment">
            <textarea
              id="field-comment"
              rows={3}
              value={values.comment}
              onChange={(e) => set("comment", e.target.value)}
              placeholder="味の感想、合わせた料理、飲んだ場所など"
              className={inputClass()}
            />
          </Field>
        </Section>

        {sources.length > 0 && (
          <details className="rounded-2xl border border-(--color-border) bg-(--color-surface) px-4 py-3 text-[13px]">
            <summary className="cursor-pointer text-(--color-text-sub)">Sources ({sources.length})</summary>
            <ul className="mt-2 flex flex-col gap-1">
              {sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-(--color-accent-text) underline underline-offset-2">
                    {s.title || s.url}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}

        {message && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-(--color-danger)">
            {message}
          </p>
        )}

        <div className="flex gap-2">
          {!isSavedRecord && (
            <button
              type="button"
              disabled={busy}
              onClick={() => persist("draft", true)}
              className="min-h-11 flex-1 rounded-full border border-(--color-border) bg-(--color-surface) text-[14px] font-medium disabled:opacity-50"
            >
              {saving === "draft" ? "Saving…" : "Save draft"}
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 flex-1 rounded-full bg-(--color-primary) text-[14px] font-medium text-(--color-on-primary) disabled:opacity-50"
          >
            {saving === "saved" ? "Saving…" : "Save"}
          </button>
        </div>

        {record && !isSavedRecord && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmDelete(true)}
            className="min-h-10 self-center px-4 text-[13px] text-(--color-danger) disabled:opacity-50"
          >
            {saving === "delete" ? "Deleting…" : "Delete draft"}
          </button>
        )}

        <ConfirmDialog
          open={choices != null}
          title="Which one?"
          message={choices?.note ?? "Several drinks matched. Pick one."}
          onClose={() => setChoices(null)}
          actions={[
            ...(choices?.candidates ?? []).map((c, i) => ({
              label: `${i + 1}. ${c.name}${c.category ? ` · ${c.category}` : ""}`,
              onClick: () => handlePickCandidate(c),
            })),
            { label: "Cancel", onClick: () => setChoices(null) },
          ]}
        />

        <ConfirmDialog
          open={confirmDelete}
          title="Delete this draft?"
          message="The photo will be deleted too. This can't be undone."
          onClose={() => setConfirmDelete(false)}
          actions={[
            { label: "Delete", variant: "danger", onClick: handleDeleteDraft },
            { label: "Cancel", onClick: () => setConfirmDelete(false) },
          ]}
        />
      </form>
    </AiFilledContext.Provider>
  );
}

// ボタンから1つ選ぶ(もう一度押すと未選択に戻る)
function ChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? null : o.value)}
            className={`min-h-9 rounded-full border px-3.5 text-[13px] ${
              active
                ? "border-(--color-primary) bg-(--color-primary) font-medium text-(--color-on-primary)"
                : "border-(--color-border) bg-(--color-surface) text-(--color-text-sub)"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function inputClass(error?: string) {
  return `min-h-11 w-full rounded-xl border bg-(--color-surface) px-3 py-2 text-[15px] outline-none focus:border-(--color-primary) ${
    error ? "border-(--color-danger)" : "border-(--color-border)"
  }`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
      <h2 className="text-[11px] font-medium tracking-[0.1em] text-(--color-text-sub) uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  field,
  error,
  required,
  hint,
  className = "",
  children,
}: {
  label: string;
  field: DrinkFormField;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  const ai = useContext(AiFilledContext).includes(field);
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={`field-${field}`} className="text-[12px] text-(--color-text-sub)">
          {label}
          {required && <span className="ml-0.5 text-(--color-danger)">*</span>}
        </label>
        {ai && (
          <span title="Filled in by AI" className="rounded-full bg-(--color-primary-soft) px-1.5 py-px text-[10px] font-medium tracking-wide text-(--color-accent-text)">
            AI
          </span>
        )}
      </div>
      {children}
      {hint && !error && <p className="text-[11px] text-(--color-text-sub)">{hint}</p>}
      {error && <p className="text-[12px] text-(--color-danger)">{error}</p>}
    </div>
  );
}

function NumberField({
  label,
  unit,
  field,
  values,
  errors,
  set,
  integer,
  placeholder,
}: {
  label: string;
  unit?: string;
  field: DrinkFormField;
  values: DrinkFormValues;
  errors: DrinkFormErrors;
  set: <K extends DrinkFormField>(field: K, value: DrinkFormValues[K]) => void;
  integer?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={unit ? `${label} (${unit})` : label} field={field} error={errors[field]}>
      <input
        id={`field-${field}`}
        // 日本酒度はマイナスを打てるよう、数字専用キーボードにしない
        inputMode={field === "sake_meter" ? "text" : integer ? "numeric" : "decimal"}
        value={values[field] as string}
        onChange={(e) => set(field, e.target.value as never)}
        placeholder={placeholder}
        className={inputClass(errors[field])}
      />
    </Field>
  );
}
