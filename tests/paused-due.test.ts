import { test } from "node:test";
import assert from "node:assert/strict";
import { dueDateForStatus } from "../app/tasks.ts";

test("demanda pausada não tem prazo", () => {
  assert.equal(dueDateForStatus("paused", "2026-11-20"), null, "pausada perde o prazo");
  assert.equal(dueDateForStatus("paused", null), null);
  assert.equal(dueDateForStatus("in_progress", "2026-11-20"), "2026-11-20", "outros status mantêm o prazo");
  assert.equal(dueDateForStatus("blocked", "2026-11-20"), "2026-11-20");
});
