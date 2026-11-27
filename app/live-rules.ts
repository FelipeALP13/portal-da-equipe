// Atualização ao vivo: regras puras (testadas). Ver app/live.ts e worker/live.ts.

/** Ninguém mexe (mouse, teclado, toque, rolagem) há 10 min: as atualizações automáticas param. */
export const IDLE_MS = 10 * 60 * 1000;

/** Áreas que mudaram desde a última consulta. Na primeira consulta (sem anterior), nenhuma. */
export function changedAreas(previous: Record<string, string> | null, next: Record<string, string>): string[] {
  if (!previous) return [];
  return Object.keys(next).filter((area) => previous[area] !== next[area]);
}

/** A tela precisa recarregar? Sem lista de áreas, recarrega com qualquer mudança; "*" (voltou da pausa) vale para todas. */
export function concerns(changed: readonly string[], areas?: readonly string[]) {
  if (!changed.length) return false;
  if (!areas || changed.includes("*")) return true;
  return changed.some((area) => areas.includes(area));
}
