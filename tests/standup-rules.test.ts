import { test } from "node:test";
import assert from "node:assert/strict";
import { isDailyDay, nextDailyDay } from "../app/standup-rules.ts";

test("daily: só na segunda-feira", () => {
  assert.equal(isDailyDay("2026-11-30"), true, "segunda");
  assert.equal(isDailyDay("2026-11-27"), false, "sexta");
  assert.equal(isDailyDay("2026-11-29"), false, "domingo");
});

test("daily: próxima segunda", () => {
  assert.equal(nextDailyDay("2026-11-27"), "2026-11-30", "de sexta para segunda");
  assert.equal(nextDailyDay("2026-11-30"), "2026-11-30", "na segunda, é hoje");
  assert.equal(nextDailyDay("2026-12-01"), "2026-12-07", "de terça para a outra segunda");
});
