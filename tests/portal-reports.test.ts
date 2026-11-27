import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanReport, sortReports } from "../app/portal-reports.ts";

test("relato: limpa o texto e exige um título", () => {
  const { report, error } = cleanReport({ kind: "idea", title: "  Botão   cortado  ", details: "linha 1\r\n\n\n\nlinha 2  ", screen: "Demandas" });
  assert.equal(error, null);
  assert.equal(report.kind, "idea");
  assert.equal(report.title, "Botão cortado");
  assert.equal(report.details, "linha 1\n\nlinha 2", "sem linhas em branco sobrando");
  assert.equal(cleanReport({ title: "ab" }).error !== null, true, "título curto demais");
  assert.equal(cleanReport({ kind: "hack", title: "Tela branca" }).report.kind, "bug", "tipo desconhecido vira erro");
});

test("relato: abertos primeiro (mais antigos no topo), depois os decididos mais recentes", () => {
  const rows = [
    { id: 1, status: "done" as const, createdAt: "2026-11-01", updatedAt: "2026-11-03" },
    { id: 2, status: "open" as const, createdAt: "2026-11-05", updatedAt: "2026-11-05" },
    { id: 3, status: "doing" as const, createdAt: "2026-11-02", updatedAt: "2026-11-06" },
    { id: 4, status: "declined" as const, createdAt: "2026-11-01", updatedAt: "2026-11-07" },
  ];
  assert.deepEqual(sortReports(rows).map((row) => row.id), [3, 2, 4, 1]);
});
