import { describe, expect, it } from "vitest";
import { nextRatingOnTap, ratingFromPosition, stepRating } from "./rating";

describe("ratingFromPosition", () => {
  const width = 200; // 星1つ = 40px、半分 = 20px
  it("星の左半分は0.5、右半分は1.0刻み", () => {
    expect(ratingFromPosition(5, width)).toBe(0.5);
    expect(ratingFromPosition(30, width)).toBe(1);
    expect(ratingFromPosition(130, width)).toBe(3.5);
    expect(ratingFromPosition(199, width)).toBe(5);
  });
  it("端をはみ出しても0.5〜5に収まる", () => {
    expect(ratingFromPosition(-10, width)).toBe(0.5);
    expect(ratingFromPosition(0, width)).toBe(0.5);
    expect(ratingFromPosition(500, width)).toBe(5);
  });
});

describe("nextRatingOnTap", () => {
  it("違う値をタップするとその値になる", () => {
    expect(nextRatingOnTap(null, 3.5)).toBe(3.5);
    expect(nextRatingOnTap(2, 4)).toBe(4);
  });
  it("同じ値をもう一度タップすると未入力に戻る", () => {
    expect(nextRatingOnTap(3.5, 3.5)).toBeNull();
  });
});

describe("stepRating", () => {
  it("0.5ずつ動き、0.5〜5に収まる", () => {
    expect(stepRating(null, 0.5)).toBe(0.5);
    expect(stepRating(3, 0.5)).toBe(3.5);
    expect(stepRating(5, 0.5)).toBe(5);
    expect(stepRating(0.5, -0.5)).toBe(0.5);
  });
});
