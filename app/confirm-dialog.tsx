"use client";

// Janelas de confirmação do Portal, no lugar das caixas do navegador (window.confirm/prompt/alert):
// mesmo visual das outras janelas, botão de perigo em vermelho e foco começando em "Cancelar".
// Uso: if (!(await askConfirm("Excluir o artigo “X”?"))) return;
//      const note = await askText("Recusar o pedido? Se quiser, escreva o motivo."); // null = cancelou
//      await showNotice("Lembrete enviado para 3 pessoas.");
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import AlertTriangle from "lucide-react/icons/triangle-alert";
import Info from "lucide-react/icons/info";

export type ConfirmOptions = {
  /** Título em destaque. Sem ele, usa a pergunta da mensagem. */
  title?: string;
  /** Texto do botão que confirma. Sem ele, usa o verbo da pergunta ("Excluir", "Tirar"...). */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Botão vermelho. Sem isso, vale para verbos como excluir, apagar, remover, revogar. */
  danger?: boolean;
};

type Request =
  | { id: number; kind: "confirm"; title: string; body: string; confirmLabel: string; cancelLabel: string; danger: boolean; resolve: (value: boolean) => void }
  | { id: number; kind: "text"; title: string; body: string; confirmLabel: string; cancelLabel: string; danger: boolean; placeholder: string; initial: string; resolve: (value: string | null) => void }
  | { id: number; kind: "notice"; title: string; body: string; confirmLabel: string; cancelLabel: string; danger: false; resolve: (value: boolean) => void };

const DANGER_VERBS = new Set(["excluir", "apagar", "remover", "revogar", "tirar", "descartar", "desligar", "desconectar", "encerrar", "sair", "cancelar", "parar", "recusar"]);

let queue: Request[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const emit = () => { for (const listener of listeners) listener(); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const current = () => queue[0] ?? null;

/** Divide "Excluir X? Os comentários também somem." em título (a pergunta) e explicação (o resto). */
export function splitMessage(message: string) {
  const text = message.trim();
  const match = text.match(/^(.*?\?)(\s+[\s\S]*)?$/);
  if (match && match[2]?.trim()) return { title: match[1].trim(), body: match[2].trim() };
  // Pergunta no fim ("Demanda DEM-3 criada. Abrir agora?"): o fato vira explicação e a pergunta vira título.
  const tail = text.match(/^([\s\S]*?[.!])\s+([^.!?]+\?)$/);
  if (tail) return { title: tail[2].trim(), body: tail[1].trim() };
  return { title: text, body: "" };
}

/** Primeira palavra da pergunta, quando é um verbo no infinitivo ("Excluir", "Tirar", "Gerar"). */
export function verbOf(title: string) {
  const first = title.replace(/^[^\p{L}]+/u, "").split(/[\s?,.:]+/)[0] ?? "";
  return /^\p{L}+(ar|er|ir)$/iu.test(first) ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "";
}

function open<T>(build: (resolve: (value: T) => void, id: number) => Request): Promise<T> {
  // Fora do navegador (servidor, testes) não há janela: responde como "cancelou".
  if (typeof window === "undefined") return Promise.resolve((null as unknown) as T);
  return new Promise<T>((resolve) => {
    nextId += 1;
    queue = [...queue, build(resolve as (value: T) => void, nextId)];
    emit();
  });
}

function labels(message: string, options: ConfirmOptions, fallback: string) {
  const split = splitMessage(message);
  const title = options.title ?? split.title;
  const body = options.title ? message.trim() : split.body;
  const verb = verbOf(title);
  const confirmLabel = options.confirmLabel ?? (verb || fallback);
  const danger = options.danger ?? DANGER_VERBS.has(verb.toLowerCase());
  // "Cancelar este pedido?" já usa "Cancelar" para confirmar: o outro botão vira "Voltar".
  const cancelLabel = options.cancelLabel ?? (confirmLabel.toLowerCase() === "cancelar" ? "Voltar" : "Cancelar");
  return { title, body, confirmLabel, cancelLabel, danger };
}

/** Pergunta sim ou não. Resolve true quando a pessoa confirma. */
export function askConfirm(message: string, options: ConfirmOptions = {}) {
  return open<boolean>((resolve, id) => ({ id, kind: "confirm", ...labels(message, options, "Confirmar"), resolve }));
}

/** Pede um texto opcional (ex.: motivo da recusa). Resolve o texto, ou null quando a pessoa cancela. */
export function askText(message: string, options: ConfirmOptions & { placeholder?: string; initial?: string } = {}) {
  return open<string | null>((resolve, id) => ({ id, kind: "text", ...labels(message, options, "Enviar"), placeholder: options.placeholder ?? "Opcional", initial: options.initial ?? "", resolve }));
}

/** Aviso simples, só com "Entendi". */
export function showNotice(message: string, options: { title?: string } = {}) {
  const split = splitMessage(message);
  return open<boolean>((resolve, id) => ({ id, kind: "notice", title: options.title ?? split.title, body: options.title ? message : split.body, confirmLabel: "Entendi", cancelLabel: "", danger: false, resolve }));
}

function settle(request: Request, value: boolean | string | null) {
  queue = queue.filter((entry) => entry.id !== request.id);
  emit();
  (request.resolve as (value: boolean | string | null) => void)(value);
}

/** Desenha a janela da vez. Fica montado uma vez no layout. */
export default function ConfirmHost() {
  const request = useSyncExternalStore(subscribe, current, () => null);
  // A chave recria a janela a cada pedido: o texto digitado começa do valor inicial daquele pedido.
  return request ? <ConfirmWindow key={request.id} request={request} /> : null;
}

function ConfirmWindow({ request }: { request: Request }) {
  const [text, setText] = useState(request.kind === "text" ? request.initial : "");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (request.kind === "text") window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [request]);

  useEffect(() => {
    // Esc fecha só esta janela (sem fechar a janela de baixo, como a demanda aberta).
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault(); event.stopImmediatePropagation();
      settle(request, request.kind === "text" ? null : false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [request]);

  const cancel = () => settle(request, request.kind === "text" ? null : request.kind === "notice" ? true : false);
  const confirm = () => settle(request, request.kind === "text" ? text : true);
  const Icon = request.danger ? AlertTriangle : Info;

  return createPortal(<div className="modal-layer nested confirm-layer">
    <button className="backdrop" onClick={cancel} aria-label="Fechar" tabIndex={-1} />
    <form className={`modal confirm-modal ${request.danger ? "danger" : ""}`} role={request.danger ? "alertdialog" : "dialog"} aria-labelledby={`confirmar-${request.id}`} aria-describedby={request.body ? `confirmar-texto-${request.id}` : undefined}
      onSubmit={(event) => { event.preventDefault(); confirm(); }}>
      <div className="confirm-body">
        <span className="confirm-icon" aria-hidden="true"><Icon size={20} /></span>
        <div>
          <h2 id={`confirmar-${request.id}`}>{request.title}</h2>
          {request.body && <p id={`confirmar-texto-${request.id}`}>{request.body}</p>}
          {request.kind === "text" && <textarea ref={inputRef} rows={3} maxLength={500} value={text} onChange={(event) => setText(event.target.value)} placeholder={request.placeholder} aria-label="Motivo"
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); confirm(); } }} />}
        </div>
      </div>
      <div className="modal-actions">
        {request.kind !== "notice" && <button type="button" className="secondary-button" onClick={cancel}>{request.cancelLabel}</button>}
        <button type="submit" className={`primary-button ${request.danger ? "danger-button" : ""}`}>{request.confirmLabel}</button>
      </div>
    </form>
  </div>, document.body);
}
