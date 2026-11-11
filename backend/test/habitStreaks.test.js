import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, calculateCurrentStreak } from "../src/utils/habitStreaks.js";

// 2026-11-11 is a Wednesday.
const WEDNESDAY = "2026-11-11";

describe("calculateCurrentStreak: daily", () => {
  it("is 0 with no completions", () => {
    assert.equal(calculateCurrentStreak("daily", [], WEDNESDAY), 0);
  });

  it("counts consecutive days ending today", () => {
    const dates = ["2026-11-11", "2026-11-10", "2026-11-09"];
    assert.equal(calculateCurrentStreak("daily", dates, WEDNESDAY), 3);
  });

  it("keeps the streak when today is not done yet", () => {
    const dates = ["2026-11-10", "2026-11-09"];
    assert.equal(calculateCurrentStreak("daily", dates, WEDNESDAY), 2);
  });

  it("resets after a missed day", () => {
    const dates = ["2026-11-09", "2026-11-08"];
    assert.equal(calculateCurrentStreak("daily", dates, WEDNESDAY), 0);
  });

  it("stops counting at a gap", () => {
    const dates = ["2026-11-11", "2026-11-10", "2026-11-08"];
    assert.equal(calculateCurrentStreak("daily", dates, WEDNESDAY), 2);
  });

  it("ignores dates after today and works in any order", () => {
    const dates = ["2026-11-09", "2026-11-12", "2026-11-11", "2026-11-10"];
    assert.equal(calculateCurrentStreak("daily", dates, WEDNESDAY), 3);
  });

  it("crosses month boundaries", () => {
    const dates = ["2026-12-01", "2026-11-30", "2026-11-29"];
    assert.equal(calculateCurrentStreak("daily", dates, "2026-12-01"), 3);
  });
});

describe("calculateCurrentStreak: weekdays", () => {
  it("skips weekends without breaking the streak", () => {
    // Mon 11-09, Fri 11-06, Thu 11-05
    const dates = ["2026-11-09", "2026-11-06", "2026-11-05"];
    assert.equal(calculateCurrentStreak("weekdays", dates, "2026-11-09"), 3);
  });

  it("keeps the streak on a weekend", () => {
    const dates = ["2026-11-06", "2026-11-05"]; // Fri, Thu
    assert.equal(calculateCurrentStreak("weekdays", dates, "2026-11-08"), 2); // Sunday
  });

  it("keeps the streak on Monday before it is done", () => {
    const dates = ["2026-11-06"]; // Friday
    assert.equal(calculateCurrentStreak("weekdays", dates, "2026-11-09"), 1);
  });

  it("resets after a missed weekday", () => {
    const dates = ["2026-11-09"]; // Monday; Tuesday missed
    assert.equal(calculateCurrentStreak("weekdays", dates, WEDNESDAY), 0);
  });

  it("does not count weekend completions", () => {
    const dates = ["2026-11-08", "2026-11-07"]; // Sun, Sat
    assert.equal(calculateCurrentStreak("weekdays", dates, "2026-11-09"), 0);
  });
});

describe("calculateCurrentStreak: weekly", () => {
  it("counts consecutive weeks with at least one completion", () => {
    // Weeks starting Mon 11-09, 11-02, 10-26
    const dates = ["2026-11-10", "2026-11-03", "2026-10-26"];
    assert.equal(calculateCurrentStreak("weekly", dates, WEDNESDAY), 3);
  });

  it("keeps the streak when this week is not done yet", () => {
    const dates = ["2026-11-08", "2026-11-01"]; // Sundays end their weeks
    assert.equal(calculateCurrentStreak("weekly", dates, WEDNESDAY), 2);
  });

  it("counts several completions in one week once", () => {
    const dates = ["2026-11-11", "2026-11-10", "2026-11-09"];
    assert.equal(calculateCurrentStreak("weekly", dates, WEDNESDAY), 1);
  });

  it("resets after a missed week", () => {
    const dates = ["2026-10-28"];
    assert.equal(calculateCurrentStreak("weekly", dates, WEDNESDAY), 0);
  });
});

describe("addDays", () => {
  it("adds and subtracts calendar days", () => {
    assert.equal(addDays("2026-11-30", 1), "2026-12-01");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  });
});
