"use client";

// Atualização ao vivo: consulta /api/live e, quando alguém da equipe muda algo, avisa as telas abertas
// para recarregarem, sem precisar apertar F5. Cada consulta conta no limite diário da Cloudflare, então:
// - cada tela só recarrega quando muda a ÁREA dela (useLiveRefresh(load, ["tasks"]));
// - nada consulta com a aba escondida nem depois de 10 min sem ninguém mexer (isActive); no primeiro
//   movimento, tudo atualiza na hora;
// - várias abas da mesma pessoa dividem a consulta (uma consulta e avisa as outras pelo BroadcastChannel).
import { useEffect, useRef } from "react";
import { changedAreas, concerns, IDLE_MS } from "./live-rules";

export const LIVE_EVENT = "portal-live";
const INTERVAL_MS = 20000;

let lastActivity = Date.now();
let idle = false;
let activityBound = false;

/** Aba visível e alguém mexeu nos últimos 10 min: só assim as telas consultam o servidor sozinhas. */
export function isActive() {
  if (typeof document === "undefined") return false;
  if (document.visibilityState !== "visible") return false;
  if (Date.now() - lastActivity > IDLE_MS) idle = true;
  return !idle;
}

/** Avisa as telas: estas áreas mudaram ("*" = todas, ao voltar da pausa). */
function announce(areas: string[]) {
  if (areas.length) window.dispatchEvent(new CustomEvent<string[]>(LIVE_EVENT, { detail: areas }));
}

function bindActivity() {
  if (activityBound) return;
  activityBound = true;
  const onActivity = () => {
    lastActivity = Date.now();
    if (idle) { idle = false; announce(["*"]); }
  };
  for (const type of ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"]) window.addEventListener(type, onActivity, { passive: true, capture: true });
}

/** Fica no painel principal: vigia as versões por área e dispara o aviso para as telas. */
export function useLiveSync(enabled: boolean) {
  const last = useRef<Record<string, string> | null>(null);
  useEffect(() => {
    if (!enabled) return;
    bindActivity();
    let stopped = false;
    let busy = false;
    let sharedAt = 0;
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("portal-live");
    const apply = (versions: Record<string, string>) => {
      const changed = changedAreas(last.current, versions);
      last.current = versions;
      announce(changed);
    };
    // Outra aba desta pessoa acabou de consultar: usa o resultado dela em vez de consultar de novo.
    if (channel) channel.onmessage = (event: MessageEvent<{ versions: Record<string, string> }>) => { sharedAt = Date.now(); if (!stopped) apply(event.data.versions); };
    const check = async (force = false) => {
      if (busy || !isActive()) return;
      if (!force && Date.now() - sharedAt < INTERVAL_MS * 0.8) return;
      busy = true;
      try {
        const response = await fetch("/api/live", { cache: "no-store" });
        if (!response.ok) return;
        const { versions } = await response.json() as { versions: Record<string, string> };
        if (stopped) return;
        channel?.postMessage({ versions });
        apply(versions ?? {});
      } catch { /* sem rede: tenta de novo no próximo ciclo */ } finally {
        busy = false;
      }
    };
    void check(true);
    const timer = window.setInterval(() => { void check(); }, INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") { lastActivity = Date.now(); idle = false; void check(true); } };
    const onWake = (event: Event) => { if ((event as CustomEvent<string[]>).detail?.includes("*")) void check(true); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener(LIVE_EVENT, onWake);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      channel?.close();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener(LIVE_EVENT, onWake);
    };
  }, [enabled]);
}

/**
 * Recarrega a tela quando alguém muda algo (o callback é o "load" da tela). Com `areas`, só quando muda
 * uma delas (o nome da rota da API: "tasks", "tickets", "inventory"...); sem, com qualquer mudança.
 */
export function useLiveRefresh(reload: () => unknown, areas?: readonly string[]) {
  const latest = useRef(reload);
  const watched = useRef(areas);
  useEffect(() => { latest.current = reload; watched.current = areas; });
  useEffect(() => {
    const onLive = (event: Event) => { if (concerns((event as CustomEvent<string[]>).detail ?? ["*"], watched.current)) void latest.current(); };
    window.addEventListener(LIVE_EVENT, onLive);
    return () => window.removeEventListener(LIVE_EVENT, onLive);
  }, []);
}
