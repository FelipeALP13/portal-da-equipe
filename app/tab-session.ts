"use client";

// Fechou o Portal (todas as abas), entra de novo com a senha.
// Cada aba guarda uma marca no sessionStorage, que só vive enquanto a aba existe (sobrevive ao F5, some ao
// fechar). Ao abrir o painel sem a marca, pergunta às outras abas do Portal se alguma está aberta
// (BroadcastChannel): se nenhuma responder, a pessoa tinha fechado o Portal, então sai e volta ao login.
import { useEffect } from "react";

const TAB_KEY = "portal.tab";
const CHANNEL = "portal-tabs";
const WAIT_MS = 400;

/** Chamado logo depois de entrar com a senha: esta aba já está liberada. */
export function markTabSignedIn() {
  try { window.sessionStorage.setItem(TAB_KEY, "1"); } catch { /* sem armazenamento */ }
}

export function useTabSession(enabled: boolean, onClosedBefore: () => void) {
  useEffect(() => {
    if (!enabled || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL);
    let marked = false;
    try { marked = window.sessionStorage.getItem(TAB_KEY) === "1"; } catch { marked = true; }
    let answered = false;
    channel.onmessage = (event: MessageEvent<string>) => {
      if (event.data === "ping" && marked) channel.postMessage("pong");
      if (event.data === "pong") answered = true;
    };
    let timer = 0;
    if (!marked) {
      channel.postMessage("ping");
      timer = window.setTimeout(() => {
        if (answered) { marked = true; markTabSignedIn(); }
        else onClosedBefore();
      }, WAIT_MS);
    }
    return () => { window.clearTimeout(timer); channel.close(); };
  }, [enabled, onClosedBefore]);
}
