"use client";

// Dá a todas as janelas do Portal o mesmo comportamento de acessibilidade: são anunciadas como janela,
// recebem o foco, mantêm o Tab dentro delas e devolvem o foco a quem abriu ao fechar.
import { useEffect } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const DIALOG = ".modal-layer > :not(.backdrop)";

type OpenDialog = { element: HTMLElement; opener: HTMLElement | null };

const focusableIn = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((node) => node.getClientRects().length > 0);

let nextTitleId = 0;

function describe(dialog: HTMLElement) {
  if (!dialog.getAttribute("role")) dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  if (dialog.getAttribute("aria-label") || dialog.getAttribute("aria-labelledby")) return;
  const title = dialog.querySelector<HTMLElement>("h2, h3");
  if (!title) return;
  if (!title.id) { nextTitleId += 1; title.id = `janela-titulo-${nextTitleId}`; }
  dialog.setAttribute("aria-labelledby", title.id);
}

export default function ModalAccessibility() {
  useEffect(() => {
    const stack: OpenDialog[] = [];
    let lastFocused: HTMLElement | null = null;

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && !target.closest(DIALOG)) lastFocused = target;
    };
    const onPointerDown = (event: PointerEvent) => {
      const control = event.target instanceof Element ? event.target.closest<HTMLElement>("button, a[href], [role='button']") : null;
      if (control && !control.closest(DIALOG)) lastFocused = control;
    };
    const sync = () => {
      const present = [...document.querySelectorAll<HTMLElement>(DIALOG)];
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (present.includes(stack[index].element)) continue;
        const [closed] = stack.splice(index, 1);
        if (closed.opener?.isConnected && (document.activeElement === document.body || !document.activeElement)) closed.opener.focus({ preventScroll: true });
      }
      for (const element of present) {
        if (stack.some((entry) => entry.element === element)) continue;
        describe(element);
        const opener = stack.length ? (document.activeElement as HTMLElement | null) : lastFocused ?? (document.activeElement as HTMLElement | null);
        stack.push({ element, opener });
        if (!element.contains(document.activeElement)) (focusableIn(element).find((node) => !node.closest(".modal-head")) ?? focusableIn(element)[0])?.focus({ preventScroll: true });
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !stack.length) return;
      const dialog = stack[stack.length - 1].element;
      const nodes = focusableIn(dialog);
      if (!nodes.length) { event.preventDefault(); return; }
      const first = nodes[0], last = nodes[nodes.length - 1], active = document.activeElement;
      if (!dialog.contains(active)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  return null;
}
