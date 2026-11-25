import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { chapterOrder, loadChapter, manualSlug, parseInline, parseManual, resolveManualLink, searchManual } from "../app/manual-markdown.ts";

test("lê títulos, parágrafos, listas, tabelas, citações e código", () => {
  const blocks = parseManual([
    "# Título",
    "<!-- nota escondida -->",
    "Primeira linha",
    "segunda linha",
    "",
    "1. Um",
    "2. Dois",
    "   continua",
    "",
    "3. Três",
    "   ```",
    "   código",
    "   ```",
    "",
    "4. Quatro",
    "- Item",
    "  - Subitem",
    "",
    "| A | B |",
    "| --- | --- |",
    "| 1 | 2 |",
    "",
    "> Aviso",
  ].join("\n"));
  assert.deepEqual(blocks.map((block) => block.type), ["heading", "paragraph", "list", "code", "list", "list", "table", "quote"]);
  assert.deepEqual(blocks[1], { type: "paragraph", lines: ["Primeira linha", "segunda linha"] });
  assert.deepEqual(blocks[2], { type: "list", ordered: true, start: 1, items: [{ text: "Um", sub: [] }, { text: "Dois continua", sub: [] }, { text: "Três", sub: [] }] });
  assert.deepEqual(blocks[3], { type: "code", text: "código" });
  assert.equal(blocks[4].type === "list" && blocks[4].start, 4);
  assert.deepEqual(blocks[5], { type: "list", ordered: false, start: 1, items: [{ text: "Item", sub: ["Subitem"] }] });
  assert.deepEqual(blocks[6], { type: "table", header: ["A", "B"], rows: [["1", "2"]] });
});

test("âncoras seguem o GitHub, com sufixo para títulos repetidos", () => {
  assert.equal(manualSlug("Permissões individuais"), "permissões-individuais");
  assert.equal(manualSlug("Prazos (SLA)"), "prazos-sla");
  const ids = parseManual("## Para que serve\n## Para que serve").map((block) => block.type === "heading" ? block.id : "");
  assert.deepEqual(ids, ["para-que-serve", "para-que-serve-1"]);
});

test("texto com negrito, código e links", () => {
  assert.deepEqual(parseInline("Clique em **Salvar** e veja [Chamados](05-chamados.md#prazos-sla) ou `Ctrl+K`."), [
    { type: "text", text: "Clique em " },
    { type: "strong", children: [{ type: "text", text: "Salvar" }] },
    { type: "text", text: " e veja " },
    { type: "link", href: "05-chamados.md#prazos-sla", children: [{ type: "text", text: "Chamados" }] },
    { type: "text", text: " ou " },
    { type: "code", text: "Ctrl+K" },
    { type: "text", text: "." },
  ]);
});

test("links: capítulos, âncoras e http(s); o resto não vira link", () => {
  assert.deepEqual(resolveManualLink("04-demandas.md#lançar-horas"), { kind: "chapter", file: "04-demandas.md", anchor: "lançar-horas" });
  assert.deepEqual(resolveManualLink("README.md"), { kind: "chapter", file: "README.md", anchor: null });
  assert.deepEqual(resolveManualLink("#quem-pode"), { kind: "anchor", anchor: "quem-pode" });
  assert.deepEqual(resolveManualLink("https://exemplo.com"), { kind: "external", url: "https://exemplo.com" });
  assert.equal(resolveManualLink("javascript:alert(1)"), null);
  assert.equal(resolveManualLink("../segredo.md"), null);
});

test("busca ignora acentos e mostra a seção", () => {
  const chapter = loadChapter("04-demandas.md", "# 4. Demandas\n\n## Lançar horas\n\nInforme as horas, por exemplo 1,5.\n");
  assert.equal(chapter.title, "Demandas");
  const [hit] = searchManual([chapter], "lancar HORAS");
  assert.equal(hit.heading, "Lançar horas");
  assert.equal(hit.anchor, "lançar-horas");
  assert.deepEqual(searchManual([chapter], "x"), []);
});

test("o manual de verdade: todo link interno aponta para capítulo e seção que existem", () => {
  const dir = new URL("../docs/manual/", import.meta.url);
  const files = readdirSync(dir).filter((file) => file.endsWith(".md"));
  const chapters = files.map((file) => loadChapter(file, readFileSync(new URL(file, dir), "utf8")));
  assert.equal([...files].sort((a, b) => chapterOrder(a).localeCompare(chapterOrder(b)))[0], "README.md");
  const ids = new Map(chapters.map((chapter) => [chapter.file, new Set(chapter.blocks.flatMap((block) => block.type === "heading" ? [block.id] : []))]));
  const problems: string[] = [];
  const visit = (owner: string, text: string) => {
    for (const token of parseInline(text)) {
      if (token.type === "strong") token.children.forEach((child) => child.type === "link" && visit(owner, `[x](${child.href})`));
      if (token.type !== "link") continue;
      const target = resolveManualLink(token.href);
      if (!target) { problems.push(`${owner}: ${token.href}`); continue; }
      if (target.kind === "external") continue;
      const file = target.kind === "chapter" ? target.file : owner;
      if (!ids.has(file)) problems.push(`${owner}: ${token.href}`);
      else if (target.anchor && !ids.get(file)!.has(target.anchor)) problems.push(`${owner}: ${token.href}`);
    }
  };
  for (const chapter of chapters) {
    for (const block of chapter.blocks) {
      const texts = block.type === "paragraph" || block.type === "quote" ? block.lines : block.type === "list" ? block.items.flatMap((item) => [item.text, ...item.sub]) : block.type === "table" ? [block.header, ...block.rows].flat() : block.type === "heading" ? [block.text] : [];
      texts.forEach((text) => visit(chapter.file, text));
    }
  }
  assert.deepEqual(problems, []);
});
