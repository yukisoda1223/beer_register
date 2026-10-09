import { describe, expect, it } from "vitest";
import { moveItem, normalizeKindSettings } from "./settings";

describe("normalizeKindSettings", () => {
  it("drops unknown kinds and appends missing ones to the order", () => {
    expect(normalizeKindSettings(["wine", "shochu", "beer"], ["beer", "wine"])).toEqual({
      order: ["wine", "beer", "sake", "whisky", "cider"],
      visible: ["wine", "beer"],
    });
  });
  it("falls back to the default visible kinds when none are left", () => {
    expect(normalizeKindSettings(null, ["shochu"]).visible).toEqual(["beer", "sake"]);
  });
});

describe("moveItem", () => {
  it("moves an item down and up", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });
});
