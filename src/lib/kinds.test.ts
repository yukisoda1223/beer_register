import { describe, expect, it } from "vitest";
import { isKind, switchKindInPath } from "./kinds";

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
  it("beer と sake だけを受け付ける", () => {
    expect(isKind("beer")).toBe(true);
    expect(isKind("sake")).toBe(true);
    expect(isKind("wine")).toBe(false);
    expect(isKind(undefined)).toBe(false);
  });
});
