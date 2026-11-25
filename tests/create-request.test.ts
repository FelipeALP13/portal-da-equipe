import { test } from "node:test";
import assert from "node:assert/strict";
import { requestCreate, takePendingCreate } from "../app/create-request.ts";

// requestCreate avisa a tela pelo window; aqui basta um window de mentira.
Object.assign(globalThis, { window: { setTimeout: () => 0, dispatchEvent: () => true } });

test("pedido de criação vai só para a tela certa e só uma vez", () => {
  requestCreate("copa");
  assert.equal(takePendingCreate("agenda"), false, "outra tela não atende");
  assert.equal(takePendingCreate("copa"), true, "o pedido continua guardado para a tela certa");

  requestCreate("absence");
  assert.equal(takePendingCreate("absence"), true);
  assert.equal(takePendingCreate("absence"), false, "não reabre ao voltar para a tela");
});

test("pedido antigo não abre formulário sozinho", () => {
  requestCreate("agenda");
  assert.equal(takePendingCreate("agenda", Date.now() + 60_000), false);
});
