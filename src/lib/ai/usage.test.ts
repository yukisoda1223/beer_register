import { describe, expect, it } from "vitest";
import { startOfTodayJST } from "./usage";

describe("startOfTodayJST", () => {
  it("日本時間の0時(UTCでは前日15時)を返す", () => {
    expect(startOfTodayJST(new Date("2026-10-05T03:00:00Z")).toISOString()).toBe("2026-10-04T15:00:00.000Z");
    // UTC 16時 = 日本時間で翌日1時
    expect(startOfTodayJST(new Date("2026-10-05T16:00:00Z")).toISOString()).toBe("2026-10-05T15:00:00.000Z");
  });
});
