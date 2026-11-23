import { test } from "node:test";
import assert from "node:assert/strict";
import { DATA_SETS, importFields, isDataSet, mapSheet, parseCsv, parseDay, parseNumber, readCell, SCREEN_DATA, templateGuide, type DataField } from "../app/data-transfer.ts";

test("datas brasileiras e ISO; data impossível é recusada", () => {
  assert.equal(parseDay("25/03/2026"), "2026-03-25");
  assert.equal(parseDay("2026-03-25"), "2026-03-25");
  assert.equal(parseDay("5/3/26"), "2026-03-05");
  assert.equal(parseDay("31/02/2026"), null);
  assert.equal(parseDay("amanhã"), null);
});

test("números no formato brasileiro e internacional", () => {
  assert.equal(parseNumber("1.234,5"), 1234.5);
  assert.equal(parseNumber("12.5"), 12.5);
  assert.equal(parseNumber("R$ 30"), 30);
  assert.equal(parseNumber("abc"), null);
});

test("células: obrigatório, opção por rótulo, sim/não e limite de tamanho", () => {
  const required: DataField = { key: "a", header: "Nome", required: true, max: 5 };
  assert.match(readCell(required, " ").error ?? "", /obrigatório/);
  assert.match(readCell(required, "123456").error ?? "", /passa de 5/);
  const choice: DataField = { key: "b", header: "Tipo", kind: "choice", options: { vacation: "Férias" } };
  assert.equal(readCell(choice, "ferias").value, "vacation");
  assert.ok(readCell(choice, "outro").error);
  assert.equal(readCell({ key: "c", header: "Ativo", kind: "bool" }, "Não").value, false);
  assert.equal(readCell({ key: "d", header: "Aniversário", kind: "birthday" }, "25/03").value, "03-25");
  assert.equal(readCell({ key: "e", header: "Texto" }, "'=SOMA(A1)").value, "=SOMA(A1)");
});

test("planilha: acha o título, pula linha vazia e aponta coluna obrigatória faltando", () => {
  const ok = mapSheet("clients", [["Lista de clientes"], ["Cliente", "E-mail", "Coluna extra"], ["ACME", "a@acme.com", "x"], [], ["Beta", "", ""]]);
  assert.deepEqual(ok.missing, []);
  assert.deepEqual(ok.rows.map((row) => [row.line, row.cells.name]), [[3, "ACME"], [5, "Beta"]]);
  assert.equal("Coluna extra" in ok.rows[0].cells, false);
  assert.deepEqual(mapSheet("absences", [["Pessoa", "Tipo"], ["Ana", "Férias"]]).missing, ["Início", "Fim"]);
});

test("CSV com ponto e vírgula, vírgula, aspas e quebra de linha", () => {
  assert.deepEqual(parseCsv('﻿Nome;Obs\r\nAna;"linha 1\nlinha ""2"""\r\n'), [["Nome", "Obs"], ["Ana", 'linha 1\nlinha "2"']]);
  assert.deepEqual(parseCsv("a,b\n1,2"), [["a", "b"], ["1", "2"]]);
});

test("colunas só de leitura não entram na importação e toda tela aponta para conjuntos reais", () => {
  assert.equal(importFields("items").some((field) => field.key === "unopenedQty"), false);
  for (const sets of Object.values(SCREEN_DATA)) for (const key of sets) assert.ok(isDataSet(key));
  assert.equal(isDataSet("constructor"), false);
  for (const key of Object.keys(DATA_SETS) as (keyof typeof DATA_SETS)[]) if (DATA_SETS[key].importable) assert.ok(templateGuide(key).length > 0);
});
