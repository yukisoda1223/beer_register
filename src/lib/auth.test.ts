import { describe, expect, it } from "vitest";
import { isAllowedEmail } from "./auth";

describe("isAllowedEmail", () => {
  it("許可したメールだけ通す(大文字小文字・前後の空白は無視)", () => {
    expect(isAllowedEmail("me@example.com", "me@example.com")).toBe(true);
    expect(isAllowedEmail(" Me@Example.com ", "me@example.com")).toBe(true);
    expect(isAllowedEmail("other@example.com", "me@example.com")).toBe(false);
  });

  it("メールが無い・許可メールが未設定なら通さない", () => {
    expect(isAllowedEmail(undefined, "me@example.com")).toBe(false);
    expect(isAllowedEmail("me@example.com", "")).toBe(false);
    expect(isAllowedEmail("me@example.com", undefined)).toBe(false);
  });
});
