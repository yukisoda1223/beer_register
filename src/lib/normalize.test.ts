import { describe, expect, it } from "vitest";
import { normalizeName } from "./normalize";

describe("normalizeName", () => {
  it("全角英数字を半角にし、空白を除き、小文字にする", () => {
    expect(normalizeName("ＩＰＡ　Ｎｏ．１")).toBe("ipano.1");
    expect(normalizeName("  Hazy  IPA ")).toBe("hazyipa");
  });
  it("半角カナは全角カナにそろう", () => {
    expect(normalizeName("ﾋﾟﾙｽﾅｰ")).toBe("ピルスナー");
  });
  it("同じ銘柄の書き方の違いが同じキーになる", () => {
    expect(normalizeName("月見川 純米吟醸")).toBe(normalizeName("月見川　純米吟醸"));
  });
});
