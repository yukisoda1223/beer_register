import { describe, expect, it } from "vitest";
import { onlyFilled } from "./save-drink";

describe("onlyFilled", () => {
  it("空の値(null・空文字・空の配列)を除く", () => {
    expect(onlyFilled({ a: "x", b: null, c: "", d: [], e: 0, f: ["s"] })).toEqual({ a: "x", e: 0, f: ["s"] });
  });
});
