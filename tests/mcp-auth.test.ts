import { test } from "node:test";
import assert from "node:assert/strict";
import { bearerToken, hashApiToken, newApiToken, tokenIsUsable } from "../app/mcp-auth.ts";

test("MCP: chave pessoal tem formato reconhecível e resumo estável", async () => {
  const token = newApiToken();
  assert.match(token, /^portal_[0-9a-f]{64}$/);
  assert.notEqual(newApiToken(), token, "cada chave é diferente");
  assert.equal(await hashApiToken(token), await hashApiToken(token));
  assert.notEqual(await hashApiToken(token), token, "no banco fica só o resumo");
});

test("MCP: só aceita 'Bearer portal_...' no formato certo", () => {
  const token = "portal_" + "a".repeat(64);
  assert.equal(bearerToken(`Bearer ${token}`), token);
  assert.equal(bearerToken(`bearer ${token}  `), token);
  assert.equal(bearerToken(null), null);
  assert.equal(bearerToken("Bearer portal_curta"), null);
  assert.equal(bearerToken(`Basic ${token}`), null);
});

test("MCP: chave vencida não vale", () => {
  assert.equal(tokenIsUsable({ expiresAt: "2026-12-01T00:00:00.000Z" }, Date.parse("2026-11-27T00:00:00Z")), true);
  assert.equal(tokenIsUsable({ expiresAt: "2026-11-01T00:00:00.000Z" }, Date.parse("2026-11-27T00:00:00Z")), false);
});
