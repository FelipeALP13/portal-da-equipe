import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanClientError, ignoredClientError, pagePath, scriptAddress } from "../app/client-errors.ts";

test("erro do navegador vai limpo para o log", () => {
  const report = cleanClientError({ kind: "rejection", message: "  TypeError:\n x is undefined ", source: "https://portal.example/_next/a.js?v=1", line: "12", column: -3, stack: "a".repeat(5000), page: "/painel?cliente=Padaria#x" });
  assert.equal(report?.kind, "rejection");
  assert.equal(report?.message, "TypeError: x is undefined");
  assert.equal(report?.source, "https://portal.example/_next/a.js", "sem ?busca");
  assert.equal(report?.line, 12);
  assert.equal(report?.column, null, "posição inválida vira null");
  assert.equal(report?.stack.length, 1500);
  assert.equal(report?.page, "/painel", "sem busca nem âncora, que podem ter nome de cliente");
});

test("pedido estranho não entra", () => {
  assert.equal(cleanClientError(null), null);
  assert.equal(cleanClientError({ message: "   " }), null);
  assert.equal(cleanClientError({ kind: "outro", message: "x" })?.kind, "error");
  assert.equal(cleanClientError({ message: "m".repeat(900) })?.message.length, 300);
});

test("erros que não ajudam são ignorados", () => {
  assert.ok(ignoredClientError("ResizeObserver loop completed with undelivered notifications.", ""));
  assert.ok(ignoredClientError("Script error.", ""));
  assert.ok(ignoredClientError("x", scriptAddress("chrome-extension://abc/content.js")));
  assert.ok(!ignoredClientError("TypeError: x", "https://portal.example/a.js"));
  assert.equal(pagePath("nada de url"), "/nada%20de%20url");
});
