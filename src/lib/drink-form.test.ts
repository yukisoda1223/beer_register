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
    const v = { ...emptyFormValues("beer"), name: " Test IPA ", category: "IPA", abv: "6.5", rice: "Yamada Nishiki", sweet_dry: 3, rating: 4, bitterness: 4 };
    const { product, tasting } = drinkPayload("beer", v, "saved");
    expect(product.name).toBe("Test IPA");
    expect(product.name_key).toBe("testipa");
    expect(product.beer_family).toBe("ale");
    expect(product.abv).toBe(6.5);
    expect(product.rice).toBeNull();
    expect(tasting.sweet_dry).toBeNull();
    expect(tasting.bitterness).toBe(4);
    expect(tasting.status).toBe("saved");
  });

  it("日本酒はビールの項目を null にし、国の初期値は Japan", () => {
    const v = { ...emptyFormValues("sake"), name: "x", bitterness: 4, polish_ratio: "50", region: "Niigata" };
    const { product, tasting } = drinkPayload("sake", v, "draft");
    expect(tasting.bitterness).toBeNull();
    expect(product.beer_family).toBeNull();
    expect(product.polish_ratio).toBe(50);
    expect(product.country).toBe("Japan");
    expect(product.region).toBe("Niigata");
  });
});
