import { test } from "node:test";
import assert from "node:assert/strict";
import { nextWorkday } from "../app/tasks.ts";

test("adiar vai para o próximo dia útil", () => {
  assert.equal(nextWorkday("2026-11-25"), "2026-11-26", "quarta → quinta");
  assert.equal(nextWorkday("2026-11-27"), "2026-11-30", "sexta → segunda");
  assert.equal(nextWorkday("2026-11-28"), "2026-11-30", "sábado → segunda");
  assert.equal(nextWorkday("2026-12-31"), "2027-01-01", "vira o ano");
});
