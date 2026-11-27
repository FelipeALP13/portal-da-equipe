import { test } from "node:test";
import assert from "node:assert/strict";
import { changedAreas, concerns } from "../app/live-rules.ts";

test("ao vivo: só as áreas que mudaram", () => {
  assert.deepEqual(changedAreas(null, { tasks: "1" }), [], "primeira consulta não dispara nada");
  assert.deepEqual(changedAreas({ tasks: "1", inventory: "5" }, { tasks: "2", inventory: "5" }), ["tasks"]);
  assert.deepEqual(changedAreas({ tasks: "1" }, { tasks: "1", tickets: "9" }), ["tickets"], "área nova conta como mudança");
});

test("ao vivo: cada tela só recarrega pela própria área", () => {
  assert.equal(concerns(["tasks"], ["inventory", "copa"]), false, "demanda alterada não recarrega o estoque");
  assert.equal(concerns(["inventory"], ["inventory", "copa"]), true);
  assert.equal(concerns(["tasks"]), true, "tela sem lista recarrega com qualquer mudança");
  assert.equal(concerns(["*"], ["inventory"]), true, "voltou da pausa: tudo atualiza");
  assert.equal(concerns([], undefined), false);
});
