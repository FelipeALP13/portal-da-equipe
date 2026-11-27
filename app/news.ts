// Novidades do Portal (docs/manual/novidades.md): regras puras (testadas), sem React nem banco.
// Usadas pela janela "Novidades do Portal" e pelo aviso no sino que todos recebem a cada versão nova.

export type NewsDay = { date: string; items: string[] };

/** Dias do changelog ("## AAAA-MM-DD" seguido de "- item"), do mais novo para o mais antigo. Ignora o comentário de instruções. */
export function parseNews(source: string): NewsDay[] {
  const text = source.replace(/\r\n/g, "\n").replace(/<!--[\s\S]*?-->/g, "");
  const days: NewsDay[] = [];
  let current: NewsDay | null = null;
  for (const line of text.split("\n")) {
    const heading = /^##\s+(\d{4}-\d{2}-\d{2})\s*$/.exec(line);
    if (heading) { current = { date: heading[1], items: [] }; days.push(current); continue; }
    if (/^#/.test(line)) { current = null; continue; }
    const item = /^-\s+(.+)$/.exec(line);
    if (item && current) current.items.push(item[1].trim());
  }
  return days.filter((day) => day.items.length).sort((a, b) => b.date.localeCompare(a.date));
}

/** O que a pessoa ainda não viu: os dias depois do último visto. Quem nunca viu recebe só o dia mais recente. */
export function newsSince(days: readonly NewsDay[], seen: string | null, max = 3): NewsDay[] {
  if (!days.length) return [];
  if (!seen) return days.slice(0, 1);
  return days.filter((day) => day.date > seen).slice(0, max);
}

/** Título curto de um item ("**Reportar problema**: ..." → "Reportar problema"), para o aviso no sino. */
export function newsTitle(item: string) {
  const bold = /^\*\*(.+?)\*\*/.exec(item);
  return (bold ? bold[1] : item.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*`]/g, "")).trim();
}

/** Texto do aviso no sino: "Novidades de 27/11: Reportar problema, Conectar uma IA (MCP) e mais 2." */
export function newsNotice(day: NewsDay) {
  const [, month, dayOfMonth] = day.date.split("-");
  const titles = [...new Set(day.items.map(newsTitle))];
  const shown = titles.slice(0, 3).join(", ");
  const rest = titles.length - 3;
  return `Novidades de ${dayOfMonth}/${month}: ${shown}${rest > 0 ? ` e mais ${rest}` : ""}.`;
}
