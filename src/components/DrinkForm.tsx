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
import { iconTypeOf, type Drink } from "@/lib/drink";
import {
  drinkPayload,
  emptyFormValues,
  formValuesFromDrink,
  validateDrinkForm,
  type DrinkFormErrors,
  type DrinkFormField,
  type DrinkFormValues,
} from "@/lib/drink-form";
import { IMAGE_BUCKET, deleteDrink, errorMessage } from "@/lib/drinks-db";
import { geocodeOnClient, locationKey } from "@/lib/geo/client";
import { compressImage, extensionOf } from "@/lib/image";
import type { Kind } from "@/lib/kinds";
import {
  BEER_CATEGORIES,
  BEER_FAMILY_LABELS,
  COUNTRY_SUGGESTIONS,
  PREFECTURES,
  SAKE_CATEGORIES,
  SERVING_TEMPS,
  beerFamilyOf,
} from "@/lib/masters";
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
  image_path: string | null;
  lat: number | null;
  lng: number | null;
  // 緯度経度を調べたときの「所在地|都道府県|国」
  locationKey: string;
};

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
          image_path: drink.image_path,
          lat: drink.lat,
          lng: drink.lng,
          locationKey: locationKey({ address: drink.maker_address, prefecture: drink.prefecture, country: drink.country }),
        }
      : null,
  );
  // 「未保存の変更があるか」の比較元
  const [baseline, setBaseline] = useState(() => ({ values: initialValues, sources: drink?.sources ?? [] }));
  // AI の処理中(quick=文章の読み取り、research=名前から調査)と、その結果のお知らせ
  const [aiBusy, setAiBusy] = useState<"quick" | "research" | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [choices, setChoices] = useState<ResearchResult | null>(null);

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

  // 名前からAIで調べる(仕様書 §8.2)。候補が1つならそのまま反映、複数なら選んでもらう
  async function research(snap: Snapshot): Promise<Snapshot> {
    setAiBusy("research");
    const result = await postAi<ResearchResponse>("/api/research", { kind, name: snap.values.name });
    if (result.candidates.length === 0) {
      setMessage("見つかりませんでした。名前を変えて試すか、手入力でお願いします。");
      return snap;
    }
    if (result.candidates.length > 1) {
      setChoices(result);
      return snap;
    }
    setInfo(result.cached ? "前に調べた結果を入れました。" : "AIが調べた値を空いている欄に入れました。");
    return withCandidate(snap, result.candidates[0]);
  }

  async function handleResearchClick() {
    if (!values.name.trim()) {
      setMessage("先に商品名を入れてください。");
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
    setInfo("AIが調べた値を空いている欄に入れました。");
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
          setMessage(`読み取りはできましたが、名前からの調査に失敗しました: ${(e as Error).message}`);
        }
      }
      if (!snap.values.name.trim()) {
        setInfo("商品名が読み取れませんでした。商品名を入れてから保存してください。");
      } else if (!isSavedRecord && (await persist("draft", false, snap))) {
        setInfo("下書きに保存しました。内容を確認して「保存」を押してください。");
      } else if (isSavedRecord) {
        setInfo("読み取った内容を入れました。確認して「保存」を押してください。");
      }
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    } finally {
      setAiBusy(null);
    }
  }

  async function handlePick(file: File) {
    setMessage(null);
    try {
      const blob = await compressImage(file);
      setImage({ type: "new", blob, previewUrl: URL.createObjectURL(blob) });
    } catch {
      setMessage("この写真は読み込めませんでした。別の写真をお試しください。");
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

      const base = drinkPayload(kind, snap.values, status);

      // 地図のピン用に、場所が変わったとき(または未取得のとき)だけ緯度経度を調べる(仕様書 §8.5)
      const place = { address: base.maker_address, prefecture: base.prefecture, country: base.country };
      const key = locationKey(place);
      let position = record && record.locationKey === key && record.lat != null ? { lat: record.lat, lng: record.lng } : null;
      if (!position) position = await geocodeOnClient(place);

      const payload = {
        ...base,
        lat: position?.lat ?? null,
        lng: position?.lng ?? null,
        image_path: imagePath,
        ai_filled_fields: snap.aiFilled,
        sources: snap.sources,
      };
      const { error } = record
        ? await supabase.from("drinks").update(payload).eq("id", id)
        : await supabase.from("drinks").insert({ id, ...payload });
      if (error) throw error;

      if (navigate) {
        router.push(status === "saved" ? `/${kind}/list?done=saved` : `/${kind}/drafts?done=draft`);
        router.refresh();
      } else {
        // この画面に残るので、保存した状態を「変更なし」の基準にする
        setRecord({ status, image_path: imagePath, lat: payload.lat, lng: payload.lng, locationKey: key });
        setImage({ type: "keep" });
        setBaseline({ values: snap.values, sources: snap.sources });
      }
      return true;
    } catch {
      setMessage(errorMessage("保存できませんでした。もう一度お試しください。"));
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
      await deleteDrink(createClient(), id, record.image_path);
      router.push(`/${kind}/drafts?done=deleted`);
      router.refresh();
    } catch {
      setMessage(errorMessage("削除できませんでした。もう一度お試しください。"));
      setSaving(null);
    }
  }

  useRegisterLeaveGuard(
    {
      isDirty: () => dirty && saving == null,
      save: () => persist(isSavedRecord ? "saved" : "draft", false),
      saveLabel: isSavedRecord ? "保存して移動" : "下書きに保存して移動",
      title: isSavedRecord ? "変更を保存しますか?" : "入力中の内容は下書きに保存しますか?",
    },
    dirty,
  );

  const previewUrl = image.type === "new" ? image.previewUrl : image.type === "remove" ? null : (imageUrl ?? null);
  const icon = iconTypeOf({ kind, beer_family: beerFamilyOf(values.category) });
  const busy = saving != null || aiBusy != null;
  const makerLabel = kind === "beer" ? "醸造所" : "酒蔵";

  return (
    <AiFilledContext.Provider value={aiFilled}>
    <form className="flex flex-col gap-5" onSubmit={(e) => (e.preventDefault(), persist("saved", true))} noValidate>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{drink ? "記録を編集" : "記録する"}</h1>
        <QuickInputSheet kind={kind} busy={aiBusy} onSubmit={handleQuickInput} />
      </div>

      {/* 1〜2. 写真と商品名 */}
      <div className="flex items-start gap-4">
        <ImagePicker
          url={previewUrl}
          icon={icon}
          onPick={handlePick}
          onRemove={() => setImage(record?.image_path ? { type: "remove" } : { type: "keep" })}
        />
        <Field label="商品名" field="name" error={errors.name} required className="flex-1">
          <textarea
            id="field-name"
            rows={2}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={kind === "beer" ? "例: ○○ペールエール" : "例: ○○ 純米吟醸"}
            className={inputClass(errors.name)}
          />
          <ResearchButton loading={aiBusy === "research"} disabled={busy} onClick={handleResearchClick} />
          {info && <p className="text-[13px] text-(--color-text-sub)">{info}</p>}
        </Field>
      </div>

      {/* 4. 種類ごとの項目 */}
      <Field label={kind === "beer" ? "カテゴリ" : "特定名称"} field="category" error={errors.category} required>
        <select
          id="field-category"
          value={values.category}
          onChange={(e) => set("category", e.target.value)}
          className={inputClass(errors.category)}
        >
          <option value="">選んでください</option>
          {(kind === "beer" ? BEER_CATEGORIES.map((c) => c.label) : SAKE_CATEGORIES).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {kind === "beer" && values.category && (
          <p className="text-[13px] text-(--color-text-sub)">系統: {BEER_FAMILY_LABELS[beerFamilyOf(values.category)!]}</p>
        )}
      </Field>

      <Field label="日付" field="drunk_on" error={errors.drunk_on} required>
        <input
          id="field-drunk_on"
          type="date"
          value={values.drunk_on}
          onChange={(e) => set("drunk_on", e.target.value)}
          className={inputClass(errors.drunk_on)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="度数" unit="%" field="abv" values={values} errors={errors} set={set} />
        {kind === "sake" && <NumberField label="精米歩合" unit="%" field="polish_ratio" values={values} errors={errors} set={set} integer />}
        {kind === "sake" && <NumberField label="日本酒度" field="sake_meter" values={values} errors={errors} set={set} placeholder="例: +3 / -2" />}
        {kind === "sake" && <NumberField label="酸度" field="acidity" values={values} errors={errors} set={set} />}
      </div>

      {kind === "sake" && (
        <Field label="酒米" field="rice">
          <input id="field-rice" value={values.rice} onChange={(e) => set("rice", e.target.value)} placeholder="例: 山田錦" className={inputClass()} />
        </Field>
      )}

      <div className="grid grid-cols-[1fr_1.3fr] gap-3">
        <NumberField label="値段" unit="円" field="price_yen" values={values} errors={errors} set={set} integer />
        <Field label="容量など" field="price_note">
          <input
            id="field-price_note"
            value={values.price_note}
            onChange={(e) => set("price_note", e.target.value)}
            placeholder={kind === "beer" ? "例: 350ml缶" : "例: 720ml"}
            className={inputClass()}
          />
        </Field>
      </div>

      <Field label={makerLabel} field="maker">
        <input id="field-maker" value={values.maker} onChange={(e) => set("maker", e.target.value)} className={inputClass()} />
      </Field>

      <Field label={`${makerLabel}の場所`} field="maker_address" hint="住所や都市名(地図のピンに使います)">
        <input
          id="field-maker_address"
          value={values.maker_address}
          onChange={(e) => set("maker_address", e.target.value)}
          placeholder="例: 新潟県長岡市"
          className={inputClass()}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="国" field="country" hint="一覧の「産地」に使います">
          <input
            id="field-country"
            list="country-suggestions"
            value={values.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="例: 日本"
            className={inputClass()}
          />
          <datalist id="country-suggestions">
            {COUNTRY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        {values.country.trim() === "日本" && (
          <Field label="都道府県" field="prefecture">
            <select
              id="field-prefecture"
              value={values.prefecture}
              onChange={(e) => set("prefecture", e.target.value)}
              className={inputClass()}
            >
              <option value="">選んでください</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <section className="flex flex-col gap-4 rounded-xl bg-(--color-surface) p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <Field label="総合評価" field="rating" error={errors.rating} required>
          <StarRating id="field-rating" label="総合評価" value={values.rating} onChange={(v) => set("rating", v)} invalid={!!errors.rating} />
        </Field>
        {kind === "beer" && (
          <Field label="苦み" field="bitterness">
            <StarRating label="苦み" value={values.bitterness} onChange={(v) => set("bitterness", v)} size={30} />
          </Field>
        )}
        {kind === "sake" && (
          <>
            <Field label="甘口〜辛口" field="sweet_dry">
              <Slider5 label="甘口〜辛口" left="甘口" right="辛口" value={values.sweet_dry} onChange={(v) => set("sweet_dry", v)} />
            </Field>
            <Field label="淡麗〜濃醇" field="light_rich">
              <Slider5 label="淡麗〜濃醇" left="淡麗" right="濃醇" value={values.light_rich} onChange={(v) => set("light_rich", v)} />
            </Field>
          </>
        )}
        <Field label="香り" field="aroma">
          <StarRating label="香り" value={values.aroma} onChange={(v) => set("aroma", v)} size={30} />
        </Field>
        {kind === "sake" && (
          <Field label="飲んだ温度" field="serving_temp">
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="飲んだ温度">
              {SERVING_TEMPS.map((t) => {
                const active = values.serving_temp === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set("serving_temp", active ? null : t.value)}
                    className={`min-h-11 rounded-xl border text-[15px] ${
                      active
                        ? "border-(--color-primary) bg-(--color-primary) font-bold text-(--color-on-primary)"
                        : "border-(--color-border) bg-(--color-surface)"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Field>
        )}
      </section>

      {/* 5. フリーコメント */}
      <Field label="コメント" field="comment">
        <textarea
          id="field-comment"
          rows={4}
          value={values.comment}
          onChange={(e) => set("comment", e.target.value)}
          placeholder="味の感想、合わせた料理など"
          className={inputClass()}
        />
      </Field>

      {sources.length > 0 && (
        <details className="rounded-xl bg-(--color-surface) p-4 text-[13px]">
          <summary className="cursor-pointer font-bold">参考にしたページ({sources.length})</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-(--color-accent-text) underline">
                  {s.title || s.url}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {message && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {message}
        </p>
      )}

      {/* 6. ボタン */}
      <div className="flex gap-3">
        {!isSavedRecord && (
          <button
            type="button"
            disabled={busy}
            onClick={() => persist("draft", true)}
            className="min-h-12 flex-1 rounded-xl border border-(--color-border) bg-(--color-surface) font-bold disabled:opacity-60"
          >
            {saving === "draft" ? "保存しています…" : "下書き保存"}
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 flex-1 rounded-xl bg-(--color-primary) font-bold text-(--color-on-primary) disabled:opacity-60"
        >
          {saving === "saved" ? "保存しています…" : "保存"}
        </button>
      </div>

      {record && !isSavedRecord && (
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
          className="min-h-11 self-center px-4 text-red-700 underline disabled:opacity-60"
        >
          {saving === "delete" ? "削除しています…" : "この下書きを削除"}
        </button>
      )}

      <ConfirmDialog
        open={choices != null}
        title="どの商品ですか?"
        message={choices?.note ?? "同じ名前の商品がいくつか見つかりました。"}
        onClose={() => setChoices(null)}
        actions={[
          ...(choices?.candidates ?? []).map((c, i) => ({
            label: `${i + 1}. ${c.name}${c.maker ? `(${c.maker})` : ""}`,
            onClick: () => handlePickCandidate(c),
          })),
          { label: "キャンセル", onClick: () => setChoices(null) },
        ]}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="この下書きを削除しますか?"
        message="写真も一緒に消え、元に戻せません。"
        onClose={() => setConfirmDelete(false)}
        actions={[
          { label: "削除する", variant: "danger", onClick: handleDeleteDraft },
          { label: "キャンセル", onClick: () => setConfirmDelete(false) },
        ]}
      />
    </form>
    </AiFilledContext.Provider>
  );
}

function inputClass(error?: string) {
  return `min-h-11 w-full rounded-xl border bg-(--color-surface) px-3 py-2 text-base ${
    error ? "border-red-600 ring-1 ring-red-600" : "border-(--color-border)"
  }`;
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
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={`field-${field}`} className="text-[13px] font-bold text-(--color-text-sub)">
          {label}
          {required && <span className="ml-1 text-red-700">*</span>}
        </label>
        {useContext(AiFilledContext).includes(field) && (
          <span
            title="AIが入れた値です"
            className="rounded-full bg-(--color-secondary) px-2 py-0.5 text-[11px] font-bold text-(--color-text)"
          >
            AI
          </span>
        )}
      </div>
      {children}
      {hint && !error && <p className="text-[13px] text-(--color-text-sub)">{hint}</p>}
      {error && <p className="text-[13px] text-red-700">{error}</p>}
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
    <Field label={unit ? `${label}(${unit})` : label} field={field} error={errors[field]}>
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
