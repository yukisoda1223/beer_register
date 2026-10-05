"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ImagePicker } from "@/components/ImagePicker";
import { Slider5 } from "@/components/Slider5";
import { StarRating } from "@/components/StarRating";
import { useRegisterLeaveGuard } from "@/components/UnsavedChanges";
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

type ImageState =
  | { type: "keep" }
  | { type: "new"; blob: Blob; previewUrl: string }
  | { type: "remove" };

type Status = "draft" | "saved";

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

  const id = drink?.id ?? newId;
  const isSavedRecord = drink?.status === "saved";
  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues) || image.type !== "keep";

  // 写真のプレビュー用URLは使い終わったら片付ける
  useEffect(() => {
    if (image.type !== "new") return;
    return () => URL.revokeObjectURL(image.previewUrl);
  }, [image]);

  function set<K extends DrinkFormField>(field: K, value: DrinkFormValues[K]) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
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

  // 保存の本体。navigate=false のときは画面を移動しない(戻るボタンの確認から呼ぶとき)
  async function persist(status: Status, navigate: boolean): Promise<boolean> {
    const found = validateDrinkForm(kind, values, status);
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

      let imagePath = drink?.image_path ?? null;
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

      const payload = { ...drinkPayload(kind, values, status), image_path: imagePath };
      const { error } = drink
        ? await supabase.from("drinks").update(payload).eq("id", id)
        : await supabase.from("drinks").insert({ id, ...payload });
      if (error) throw error;

      if (navigate) {
        router.push(status === "saved" ? `/${kind}/list?done=saved` : `/${kind}/drafts?done=draft`);
        router.refresh();
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
    if (!drink) return;
    setConfirmDelete(false);
    setSaving("delete");
    try {
      await deleteDrink(createClient(), drink.id, drink.image_path);
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
  const busy = saving != null;
  const makerLabel = kind === "beer" ? "醸造所" : "酒蔵";

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => (e.preventDefault(), persist("saved", true))} noValidate>
      <h1 className="sr-only">{drink ? "記録を編集" : "記録する"}</h1>

      {/* 1〜2. 写真と商品名 */}
      <div className="flex items-start gap-4">
        <ImagePicker
          url={previewUrl}
          icon={icon}
          onPick={handlePick}
          onRemove={() => setImage(drink?.image_path ? { type: "remove" } : { type: "keep" })}
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

      {drink && !isSavedRecord && (
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
      <label htmlFor={`field-${field}`} className="text-[13px] font-bold text-(--color-text-sub)">
        {label}
        {required && <span className="ml-1 text-red-700">*</span>}
      </label>
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
