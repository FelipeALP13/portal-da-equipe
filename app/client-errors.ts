// Erros do navegador que vão para o log do servidor (Cloudflare → Observability).
// Regras puras e testadas: o que entra no log, com tamanho limitado e sem dados de quem usa.

export const CLIENT_ERRORS_PER_PAGE = 5;
const MAX_MESSAGE = 300;
const MAX_STACK = 1500;
const MAX_SOURCE = 200;

export type ClientErrorReport = { kind: "error" | "rejection" | "render"; message: string; source: string; line: number | null; column: number | null; stack: string; page: string };

const text = (value: unknown, max: number) => (typeof value === "string" ? value : value == null ? "" : String(value)).replace(/\s+/g, " ").trim().slice(0, max);
const position = (value: unknown) => { const number = Number(value); return Number.isInteger(number) && number >= 0 && number < 10_000_000 ? number : null; };

/** Só o caminho, sem ?busca nem #âncora: a busca pode ter nomes ou códigos de clientes. */
export function pagePath(value: unknown) {
  const raw = text(value, MAX_SOURCE);
  try { return new URL(raw, "https://portal.local").pathname.slice(0, MAX_SOURCE); } catch { return ""; }
}

/** Endereço do script com o tipo (https:, chrome-extension:...) e sem ?busca. */
export function scriptAddress(value: unknown) {
  const raw = text(value, MAX_SOURCE);
  if (!raw) return "";
  try { const url = new URL(raw); return `${url.protocol}//${url.host}${url.pathname}`.slice(0, MAX_SOURCE); } catch { return pagePath(raw); }
}

/** Arruma o que o navegador mandou; null quando não há nada útil (ou o pedido veio estranho). */
export function cleanClientError(input: unknown): ClientErrorReport | null {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  const kind = body.kind === "rejection" || body.kind === "render" ? body.kind : "error";
  const message = text(body.message, MAX_MESSAGE);
  if (!message) return null;
  return {
    kind,
    message,
    source: scriptAddress(body.source),
    line: position(body.line),
    column: position(body.column),
    stack: text(body.stack, MAX_STACK),
    page: pagePath(body.page),
  };
}

/** Erros que não ajudam: extensões do navegador, scripts de outros sites e o aviso inofensivo do ResizeObserver. */
export function ignoredClientError(message: string, source: string) {
  if (/^ResizeObserver loop/i.test(message)) return true;
  if (/^Script error\.?$/i.test(message)) return true;
  return /^(chrome|moz|safari|edge)-extension:/i.test(source);
}
