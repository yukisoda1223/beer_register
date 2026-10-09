import { describe, expect, it } from "vitest";
import { headerKinds, isKind, switchKindInPath } from "./kinds";

describe("switchKindInPath", () => {
  it("同じ種類の画面のまま kind を入れ替える", () => {
    expect(switchKindInPath("/beer/list", "sake")).toBe("/sake/list");
    expect(switchKindInPath("/sake/report", "beer")).toBe("/beer/report");
    expect(switchKindInPath("/beer/drafts", "sake")).toBe("/sake/drafts");
    expect(switchKindInPath("/beer/map", "sake")).toBe("/sake/map");
  });

  it("記録の編集画面からは相手側の一覧へ移る", () => {
    expect(switchKindInPath("/beer/3f2a9c1e-0000-4000-8000-000000000000", "sake")).toBe("/sake/list");
  });

  it("kind の無い URL からはレポートへ移る", () => {
    expect(switchKindInPath("/", "sake")).toBe("/sake/report");
    expect(switchKindInPath("/login", "beer")).toBe("/beer/report");
    expect(switchKindInPath("/beer", "sake")).toBe("/sake/report");
  });
});

describe("isKind", () => {
  it("5種類だけを受け付ける", () => {
    for (const k of ["beer", "sake", "whisky", "cider", "wine"]) expect(isKind(k)).toBe(true);
    expect(isKind("mead")).toBe(false);
    expect(isKind(undefined)).toBe(false);
  });
});

describe("headerKinds", () => {
  it("並び順のとおりに、表示する種類だけを出す", () => {
    expect(headerKinds(["wine", "beer", "sake", "whisky", "cider"], ["beer", "wine"])).toEqual(["wine", "beer"]);
  });
  it("並び順に無い種類は後ろに足し、知らない値は無視する", () => {
    expect(headerKinds(["sake", "mead"], ["beer", "sake", "cider"])).toEqual(["sake", "beer", "cider"]);
  });
  it("いま見ている種類が非表示なら末尾に出す。何も無ければ beer", () => {
    expect(headerKinds(["beer", "sake"], ["beer"], "sake")).toEqual(["beer", "sake"]);
    expect(headerKinds([], [])).toEqual(["beer"]);
  });
});
