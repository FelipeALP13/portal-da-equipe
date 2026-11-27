import { test } from "node:test";
import assert from "node:assert/strict";
import { newsNotice, newsSince, newsTitle, parseNews } from "../app/news.ts";

const source = `# Novidades

<!--
## 2099-01-01
- comentário de instruções, não conta
-->

## 2026-11-27

- **Reportar problema**: novo lugar ([Primeiros passos](01-primeiros-passos.md#x)).
- **Demandas**: gaveta mais larga.
- **Chat**: fechar direto.
- **Sino**: prazos.

## 2026-11-26

- **Copa**: estoque por time.
`;

test("novidades: lê os dias do changelog, do mais novo para o mais antigo", () => {
  const days = parseNews(source);
  assert.deepEqual(days.map((day) => day.date), ["2026-11-27", "2026-11-26"], "ignora o exemplo dentro do comentário");
  assert.equal(days[0].items.length, 4);
});

test("novidades: cada pessoa vê o que ainda não viu", () => {
  const days = parseNews(source);
  assert.deepEqual(newsSince(days, null).map((day) => day.date), ["2026-11-27"], "primeira vez: só o mais recente");
  assert.deepEqual(newsSince(days, "2026-11-25").map((day) => day.date), ["2026-11-27", "2026-11-26"]);
  assert.deepEqual(newsSince(days, "2026-11-27"), [], "já viu tudo");
});

test("novidades: aviso curto para o sino", () => {
  const [day] = parseNews(source);
  assert.equal(newsTitle(day.items[0]), "Reportar problema");
  assert.equal(newsNotice(day), "Novidades de 27/11: Reportar problema, Demandas, Chat e mais 1.");
});
