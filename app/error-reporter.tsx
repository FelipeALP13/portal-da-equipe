"use client";

// Manda para o log do servidor os erros que acontecem no navegador (no máximo 5 por página aberta, sem repetir),
// para dar para ver quando algo quebra para alguém mesmo que ninguém avise.
import { useEffect } from "react";
import { CLIENT_ERRORS_PER_PAGE, ignoredClientError } from "./client-errors";

let sent = 0;
const seen = new Set<string>();

export function reportClientError(kind: "error" | "rejection" | "render", error: unknown, extra: { source?: string; line?: number; column?: number } = {}) {
  try {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : typeof error === "string" ? error : JSON.stringify(error) ?? "";
    const source = extra.source ?? "";
    if (!message || ignoredClientError(message, source)) return;
    const key = `${kind}|${message}|${source}|${extra.line ?? ""}`;
    if (seen.has(key) || sent >= CLIENT_ERRORS_PER_PAGE) return;
    seen.add(key);
    sent += 1;
    const body = JSON.stringify({ kind, message, source, line: extra.line ?? null, column: extra.column ?? null, stack: error instanceof Error ? error.stack ?? "" : "", page: window.location.pathname });
    void fetch("/api/client-errors", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    // Registrar o erro nunca pode causar outro erro na tela.
  }
}

export function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => reportClientError("error", event.error ?? event.message, { source: event.filename, line: event.lineno, column: event.colno });
    const onRejection = (event: PromiseRejectionEvent) => reportClientError("rejection", event.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onRejection); };
  }, []);
  return null;
}
