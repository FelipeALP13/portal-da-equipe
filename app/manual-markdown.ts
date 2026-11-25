// Manual de uso (docs/manual/*.md) dentro do Portal: regras puras (sem React), usadas pela tela Ajuda e pelos testes.
// Lê só o Markdown simples que o manual usa: títulos, parágrafos, listas (um nível dentro), tabelas, citações e blocos de código.
// Nada vira HTML cru: a tela monta os elementos a partir destes blocos, então o texto nunca é interpretado como código.

export type ManualListItem = { text: string; sub: string[] };
export type ManualBlock =
  | { type: "heading"; level: number; text: string; id: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; ordered: boolean; start: number; items: ManualListItem[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "quote"; lines: string[] }
  | { type: "code"; text: string };

export type ManualInline =
  | { type: "text"; text: string }
  | { type: "strong"; children: ManualInline[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; children: ManualInline[] };

export type ManualLink =
  | { kind: "chapter"; file: string; anchor: string | null }
  | { kind: "anchor"; anchor: string }
  | { kind: "external"; url: string };

export type ManualChapter = { file: string; title: string; blocks: ManualBlock[] };
export type ManualHit = { file: string; chapter: string; heading: string; anchor: string | null; snippet: string };

/** Âncora no mesmo formato do GitHub: minúsculas, sem pontuação, espaços viram hífen (acentos ficam). */
export function manualSlug(text: string) {
  return text.trim().toLocaleLowerCase("pt-BR").replace(/[^\p{L}\p{N} -]/gu, "").replace(/ /g, "-");
}

/** Texto do título sem a marcação (negrito, código e links). */
export function plainText(text: string) {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
}

const ITEM = /^([-*]|\d+\.)\s+(.*)$/;
const SUB_ITEM = /^\s{2,}([-*]|\d+\.)\s+(.*)$/;
const TABLE_SEPARATOR = /^\|?\s*:?-{2,}/;

function tableCells(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

export function parseManual(source: string): ManualBlock[] {
  const lines = source.replace(/\r\n?/g, "\n").replace(/<!--[\s\S]*?-->/g, "").split("\n");
  const blocks: ManualBlock[] = [];
  const usedIds = new Map<string, number>();
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) { index += 1; continue; }

    if (trimmed.startsWith("```")) {
      const indent = line.length - line.trimStart().length;
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index].slice(Math.min(indent, lines[index].length - lines[index].trimStart().length)));
        index += 1;
      }
      index += 1;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const text = heading[2].trim();
      const base = manualSlug(plainText(text));
      const seen = usedIds.get(base) ?? 0;
      usedIds.set(base, seen + 1);
      blocks.push({ type: "heading", level: heading[1].length, text, id: seen ? `${base}-${seen}` : base });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("|")) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        if (!TABLE_SEPARATOR.test(lines[index].trim())) rows.push(tableCells(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", header: rows[0] ?? [], rows: rows.slice(1) });
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        const text = lines[index].trim().replace(/^>\s?/, "");
        if (text) quote.push(text);
        index += 1;
      }
      blocks.push({ type: "quote", lines: quote });
      continue;
    }

    const item = line.match(ITEM);
    if (item) {
      const ordered = item[1] !== "-" && item[1] !== "*";
      const items: ManualListItem[] = [];
      while (index < lines.length) {
        const current = lines[index];
        if (!current.trim()) {
          // Linha em branco: a lista continua só se a próxima linha com texto for outro item (ou um subitem).
          let next = index + 1;
          while (next < lines.length && !lines[next].trim()) next += 1;
          const following = lines[next] ?? "";
          const top = following.match(ITEM);
          if ((top && (top[1] === "-" || top[1] === "*") === !ordered) || (SUB_ITEM.test(following) && items.length)) { index = next; continue; }
          break;
        }
        if (current.trim().startsWith("```")) break;
        const top = current.match(ITEM);
        if (top) {
          if ((top[1] === "-" || top[1] === "*") === ordered) break;
          items.push({ text: top[2].trim(), sub: [] });
          index += 1;
          continue;
        }
        const sub = current.match(SUB_ITEM);
        const last = items[items.length - 1];
        if (sub && last) { last.sub.push(sub[2].trim()); index += 1; continue; }
        if (/^\s+\S/.test(current) && last) {
          // Continuação do item (ou do último subitem) na linha de baixo.
          if (last.sub.length) last.sub[last.sub.length - 1] += ` ${current.trim()}`;
          else last.text += ` ${current.trim()}`;
          index += 1;
          continue;
        }
        break;
      }
      blocks.push({ type: "list", ordered, start: ordered ? Number(item[1].slice(0, -1)) || 1 : 1, items });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index];
      const text = current.trim();
      if (!text || text.startsWith("#") || text.startsWith("|") || text.startsWith(">") || text.startsWith("```") || ITEM.test(current)) break;
      paragraph.push(text);
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraph });
  }
  return blocks;
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/;

export function parseInline(text: string): ManualInline[] {
  const tokens: ManualInline[] = [];
  for (const part of text.split(INLINE)) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) tokens.push({ type: "strong", children: parseInline(part.slice(2, -2)) });
    else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) tokens.push({ type: "code", text: part.slice(1, -1) });
    else {
      const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (link) tokens.push({ type: "link", href: link[2], children: parseInline(link[1]) });
      else tokens.push({ type: "text", text: part });
    }
  }
  return tokens;
}

/** Para onde um link do manual leva. Só capítulos do manual, âncoras e endereços http(s); o resto vira texto. */
export function resolveManualLink(href: string): ManualLink | null {
  if (/^https?:\/\//i.test(href)) return { kind: "external", url: href };
  if (href.startsWith("#")) return href.length > 1 ? { kind: "anchor", anchor: decodeURIComponent(href.slice(1)) } : null;
  const match = href.match(/^(?:\.\/)?([\w-]+\.md)(?:#(.+))?$/);
  if (!match) return null;
  return { kind: "chapter", file: match[1], anchor: match[2] ? decodeURIComponent(match[2]) : null };
}

/** Ordem do índice: o README primeiro, depois os capítulos numerados, as perguntas frequentes e as novidades. */
export function chapterOrder(file: string) {
  if (file === "README.md") return "0";
  if (/^\d/.test(file)) return `1${file}`;
  if (file === "novidades.md") return "3";
  return `2${file}`;
}

export function loadChapter(file: string, source: string): ManualChapter {
  const blocks = parseManual(source);
  const first = blocks.find((block) => block.type === "heading");
  const title = first && first.type === "heading" ? plainText(first.text).replace(/^\d+\.\s*/, "") : file.replace(/\.md$/, "");
  return { file, title: file === "README.md" ? "Início do manual" : title, blocks };
}

const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");

function blockText(block: ManualBlock) {
  if (block.type === "paragraph" || block.type === "quote") return block.lines.join(" ");
  if (block.type === "list") return block.items.map((item) => [item.text, ...item.sub].join(" ")).join(" ");
  if (block.type === "table") return [block.header, ...block.rows].map((row) => row.join(" ")).join(" ");
  if (block.type === "code") return block.text;
  return "";
}

/** Busca por palavras (sem acento, sem diferenciar maiúsculas): devolve as seções que têm todas as palavras. */
export function searchManual(chapters: readonly ManualChapter[], query: string, limit = 30): ManualHit[] {
  const words = fold(query).split(/\s+/).filter((word) => word.length >= 2);
  if (!words.length) return [];
  const hits: ManualHit[] = [];
  for (const chapter of chapters) {
    let section = { heading: chapter.title, anchor: null as string | null, parts: [] as string[] };
    const flush = () => {
      const body = plainText(section.parts.join(" ")).replace(/\s+/g, " ").trim();
      const haystack = fold(`${section.heading} ${body}`);
      if (!words.every((word) => haystack.includes(word))) return;
      const at = Math.max(0, fold(body).indexOf(words[0]));
      // Começa o trecho numa palavra inteira, um pouco antes da primeira palavra buscada.
      const space = body.lastIndexOf(" ", Math.max(0, at - 40));
      const start = at <= 40 || space < 0 ? 0 : space + 1;
      const snippet = `${start > 0 ? "…" : ""}${body.slice(start, start + 160).trim()}${start + 160 < body.length ? "…" : ""}`;
      hits.push({ file: chapter.file, chapter: chapter.title, heading: section.heading, anchor: section.anchor, snippet });
    };
    for (const block of chapter.blocks) {
      if (block.type === "heading") {
        flush();
        section = { heading: plainText(block.text).replace(/^\d+\.\s*/, ""), anchor: block.level > 1 ? block.id : null, parts: [] };
      } else section.parts.push(blockText(block));
    }
    flush();
  }
  return hits.slice(0, limit);
}
