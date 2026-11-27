// Chaves pessoais do MCP: formato, resumo (hash) e validade. Regras puras (testadas), sem banco.

/** Prefixo reconhecível (ajuda a identificar uma chave vazada num texto ou repositório). */
export const TOKEN_PREFIX = "portal_";
export const TOKEN_DAYS = 365;
export const MAX_TOKENS_PER_PERSON = 5;
/** Grava o "último uso" no máximo a cada 15 min (cada gravação conta no limite do banco). */
export const TOUCH_EVERY_MS = 15 * 60 * 1000;

export function newApiToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return TOKEN_PREFIX + Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashApiToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** A chave no cabeçalho "Authorization: Bearer portal_..." (só o formato certo). */
export function bearerToken(header: string | null) {
  const match = /^Bearer\s+(portal_[0-9a-f]{64})\s*$/i.exec(header ?? "");
  return match ? match[1] : null;
}

export function tokenIsUsable(token: { expiresAt: string }, now: number) {
  return Date.parse(token.expiresAt) > now;
}
