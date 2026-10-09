import { describe, expect, it } from "vitest";
import { drinkPayload, emptyFormValues, parseNumber, validateDrinkForm } from "./drink-form";

describe("validateDrinkForm", () => {
  it("下書きは商品名だけあれば通る", () => {
    const v = { ...emptyFormValues("beer", "2026-10-05"), name: "テストエール" };
    expect(validateDrinkForm("beer", v, "draft")).toEqual({});
  });

  it("下書きでも商品名が空なら止める", () => {
    expect(Object.keys(validateDrinkForm("beer", emptyFormValues("beer"), "draft"))).toEqual(["name"]);
  });

  it("保存は商品名・スタイル・日付・総合評価が必要", () => {
    const v = { ...emptyFormValues("beer"), drunk_on: "" };
    expect(Object.keys(validateDrinkForm("beer", v, "saved")).sort()).toEqual(["category", "drunk_on", "name", "rating"]);
    const ok = { ...emptyFormValues("beer"), name: "x", category: "IPA", rating: 4 };
    expect(validateDrinkForm("beer", ok, "saved")).toEqual({});
  });

  it("スタイルが必須なのはビールだけ", () => {
    const base = { ...emptyFormValues("wine"), name: "x", rating: 4 };
    expect(validateDrinkForm("wine", base, "saved")).toEqual({});
    expect(Object.keys(validateDrinkForm("beer", { ...base }, "saved"))).toEqual(["category"]);
  });

  it("数字の欄に数字以外や範囲外が入っていたら止める", () => {
    const v = { ...emptyFormValues("sake"), name: "x", abv: "強め", polish_ratio: "55.5", sake_meter: "-3" };
    const errors = validateDrinkForm("sake", v, "draft");
    expect(Object.keys(errors).sort()).toEqual(["abv", "polish_ratio"]);
  });
});

describe("parseNumber", () => {
  it("全角数字・全角マイナスも読める", () => {
    expect(parseNumber("５.５")).toBe(5.5);
    expect(parseNumber("－３")).toBe(-3);
    expect(parseNumber(" ")).toBeNull();
    expect(Number.isNaN(parseNumber("abc"))).toBe(true);
  });
});

describe("drinkPayload", () => {
  it("銘柄と飲んだ記録に分け、ビールはスタイルから系統を決める", () => {
    const v = { ...emptyFormValues("beer"), name: " Test IPA ", category: "IPA", abv: "6.5", ingredient: "x", sweet_dry: 3, rating: 4, bitterness: 4 };
    const { product, tasting } = drinkPayload("beer", v, "saved");
    expect(product.name).toBe("Test IPA");
    expect(product.name_key).toBe("testipa");
    expect(product.beer_family).toBe("ale");
    expect(product.abv).toBe(6.5);
    expect(product.ingredient).toBeNull();
    expect(tasting.sweet_dry).toBeNull();
    expect(tasting.bitterness).toBe(4);
  });

  it("日本酒は甘辛・香りの強さ・飲み方を残し、ビールの項目は null。国の初期値は Japan", () => {
    const v = { ...emptyFormValues("sake"), name: "x", bitterness: 4, polish_ratio: "50", region: "Niigata", sweet_dry: 4, aroma_level: 5, body: 3, served: "cold" as const };
    const { product, tasting } = drinkPayload("sake", v, "draft");
    expect(tasting.bitterness).toBeNull();
    expect(tasting.body).toBeNull();
    expect(tasting.aroma_level).toBe(5);
    expect(tasting.served).toBe("cold");
    expect(product.polish_ratio).toBe(50);
    expect(product.country).toBe("Japan");
  });

  it("ウイスキーは熟成年数・樽・ピート・ボディ・スモーキー・飲み方", () => {
    const v = { ...emptyFormValues("whisky"), name: "x", age_years: "12", cask: "Sherry", peat: "heavy" as const, body: 4, smoky: 4.5, served: "rocks" as const, sweet_dry: 2 };
    const { product, tasting } = drinkPayload("whisky", v, "draft");
    expect(product).toMatchObject({ age_years: 12, cask: "Sherry", peat: "heavy", vintage: null, beer_family: null });
    expect(tasting).toMatchObject({ body: 4, smoky: 4.5, served: "rocks", sweet_dry: null });
  });

  it("ワインはヴィンテージ・品種・甘辛・ボディ。日本酒の飲み方は入らない", () => {
    const v = { ...emptyFormValues("wine"), name: "x", vintage: "2019", ingredient: "Pinot Noir", sweet_dry: 4, body: 2, served: "cold" as const };
    const { product, tasting } = drinkPayload("wine", v, "draft");
    expect(product).toMatchObject({ vintage: 2019, ingredient: "Pinot Noir" });
    expect(tasting).toMatchObject({ sweet_dry: 4, body: 2, served: null });
  });

  it("シードルは甘辛だけ", () => {
    const v = { ...emptyFormValues("cider"), name: "x", sweet_dry: 2, body: 4, smoky: 3 };
    const { tasting } = drinkPayload("cider", v, "draft");
    expect(tasting).toMatchObject({ sweet_dry: 2, body: null, smoky: null });
  });
});
