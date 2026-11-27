"use client";

// Botão "+ Criar" do topo e busca (Ctrl+K): pedem a uma tela que abra o próprio formulário de criação.
// A tela pode ainda não estar montada (o pedido troca de tela antes), então o pedido fica guardado
// por alguns segundos e a tela o atende ao montar; se ela já está aberta, atende pelo evento.
import { useEffect, useRef } from "react";

export type CreateKind = "agenda" | "absence" | "copa" | "report";

const EVENT = "portal:create-request";
const MAX_WAIT_MS = 5000;
let pending: { kind: CreateKind; at: number } | null = null;

export function requestCreate(kind: CreateKind) {
  pending = { kind, at: Date.now() };
  // Depois da troca de tela: se a tela for recriada (mesma tela com outra chave), quem atende é a nova.
  window.setTimeout(() => window.dispatchEvent(new CustomEvent<CreateKind>(EVENT, { detail: kind })), 0);
}

/** Retira o pedido guardado, se for deste tipo e ainda recente. Exportado para os testes. */
export function takePendingCreate(kind: CreateKind, now = Date.now()) {
  if (!pending || pending.kind !== kind) return false;
  const fresh = now - pending.at <= MAX_WAIT_MS;
  pending = null;
  return fresh;
}

export function useCreateRequest(kind: CreateKind, handler: () => void) {
  const latest = useRef(handler);
  useEffect(() => { latest.current = handler; });
  useEffect(() => {
    if (takePendingCreate(kind)) latest.current();
    const listener = (event: Event) => { if ((event as CustomEvent<CreateKind>).detail === kind && takePendingCreate(kind)) latest.current(); };
    window.addEventListener(EVENT, listener);
    return () => window.removeEventListener(EVENT, listener);
  }, [kind]);
}
