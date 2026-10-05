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

  it("保存は商品名・カテゴリ・日付・総合評価が必要", () => {
    const v = { ...emptyFormValues("beer"), drunk_on: "" };
    expect(Object.keys(validateDrinkForm("beer", v, "saved")).sort()).toEqual(["category", "drunk_on", "name", "rating"]);
    const ok = { ...emptyFormValues("beer"), name: "x", category: "IPA", rating: 4 };
    expect(validateDrinkForm("beer", ok, "saved")).toEqual({});
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
  it("ビールはカテゴリから系統を決め、日本酒の項目は null にする", () => {
    const v = { ...emptyFormValues("beer"), name: " テスト ", category: "IPA", abv: "6.5", rice: "山田錦", sweet_dry: 3 };
    const p = drinkPayload("beer", v, "saved");
    expect(p.name).toBe("テスト");
    expect(p.beer_family).toBe("ale");
    expect(p.abv).toBe(6.5);
    expect(p.rice).toBeNull();
    expect(p.sweet_dry).toBeNull();
  });

  it("都道府県は国が日本のときだけ残す", () => {
    const base = { ...emptyFormValues("beer"), name: "x", prefecture: "新潟県" };
    expect(drinkPayload("beer", { ...base, country: "日本" }, "draft").prefecture).toBe("新潟県");
    expect(drinkPayload("beer", { ...base, country: "ベルギー" }, "draft").prefecture).toBeNull();
  });

  it("日本酒はビールの項目を null にする", () => {
    const v = { ...emptyFormValues("sake"), name: "x", bitterness: 4, polish_ratio: "50" };
    const p = drinkPayload("sake", v, "draft");
    expect(p.bitterness).toBeNull();
    expect(p.beer_family).toBeNull();
    expect(p.polish_ratio).toBe(50);
    expect(p.country).toBe("日本");
  });
});
