"use client";

// Tela Ajuda: mostra o manual de uso (docs/manual/*.md) dentro do Portal, com índice e busca.
// Os arquivos entram no pacote na hora do build, então a tela mostra sempre o manual da versão publicada.
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Search from "lucide-react/icons/search";
import BookOpen from "lucide-react/icons/book-open";
import ExternalLink from "lucide-react/icons/external-link";
import { chapterOrder, loadChapter, parseInline, resolveManualLink, searchManual, type ManualBlock, type ManualChapter, type ManualInline } from "./manual-markdown";

const sources = import.meta.glob<string>("../docs/manual/*.md", { query: "?raw", import: "default" });
const fileOf = (path: string) => path.split("/").pop() ?? path;
const anchorId = (anchor: string) => `ajuda-${anchor}`;

async function loadManual(): Promise<ManualChapter[]> {
  const entries = await Promise.all(Object.entries(sources).map(async ([path, load]) => loadChapter(fileOf(path), await load())));
  return entries.sort((a, b) => chapterOrder(a.file).localeCompare(chapterOrder(b.file)));
}

type Go = (file: string, anchor: string | null) => void;

function Inline({ tokens, go }: { tokens: ManualInline[]; go: Go }): ReactNode {
  return tokens.map((token, index) => {
    if (token.type === "text") return <Fragment key={index}>{token.text}</Fragment>;
    if (token.type === "code") return <code key={index}>{token.text}</code>;
    if (token.type === "strong") return <strong key={index}><Inline tokens={token.children} go={go} /></strong>;
    const target = resolveManualLink(token.href);
    const label = <Inline tokens={token.children} go={go} />;
    if (!target) return <Fragment key={index}>{label}</Fragment>;
    if (target.kind === "external") return <a key={index} href={target.url} target="_blank" rel="noopener noreferrer">{label}<ExternalLink size={12} aria-hidden="true" /></a>;
    const file = target.kind === "chapter" ? target.file : null;
    const anchor = target.kind === "chapter" ? target.anchor : target.anchor;
    return <a key={index} href={`#${anchorId(anchor ?? "topo")}`} onClick={(event) => { event.preventDefault(); go(file ?? "", anchor); }}>{label}</a>;
  });
}

const text = (value: string, go: Go) => <Inline tokens={parseInline(value)} go={go} />;

function Block({ block, go }: { block: ManualBlock; go: Go }) {
  if (block.type === "heading") {
    const content = text(block.text, go);
    if (block.level === 1) return <h1 id={anchorId(block.id)}>{content}</h1>;
    if (block.level === 2) return <h2 id={anchorId(block.id)}>{content}</h2>;
    if (block.level === 3) return <h3 id={anchorId(block.id)}>{content}</h3>;
    return <h4 id={anchorId(block.id)}>{content}</h4>;
  }
  if (block.type === "paragraph") return <p>{block.lines.map((line, index) => <Fragment key={index}>{index > 0 && <br />}{text(line, go)}</Fragment>)}</p>;
  if (block.type === "quote") return <blockquote>{block.lines.map((line, index) => <p key={index}>{text(line, go)}</p>)}</blockquote>;
  if (block.type === "code") return <pre><code>{block.text}</code></pre>;
  if (block.type === "table") return <div className="help-table"><table>
    <thead><tr>{block.header.map((cell, index) => <th key={index} scope="col">{text(cell, go)}</th>)}</tr></thead>
    <tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => index === 0 ? <th key={index} scope="row">{text(cell, go)}</th> : <td key={index}>{text(cell, go)}</td>)}</tr>)}</tbody>
  </table></div>;
  const items = block.items.map((item, index) => <li key={index}>{text(item.text, go)}{item.sub.length > 0 && <ul>{item.sub.map((sub, subIndex) => <li key={subIndex}>{text(sub, go)}</li>)}</ul>}</li>);
  return block.ordered ? <ol start={block.start}>{items}</ol> : <ul>{items}</ul>;
}

export default function HelpView() {
  const [chapters, setChapters] = useState<ManualChapter[] | null>(null);
  const [error, setError] = useState("");
  const [file, setFile] = useState("README.md");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<{ anchor: string | null; key: number }>({ anchor: null, key: 0 });
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let alive = true;
    loadManual().then((list) => { if (alive) setChapters(list); }).catch(() => { if (alive) setError("Não foi possível carregar o manual. Recarregue a página."); });
    return () => { alive = false; };
  }, []);

  // Depois de trocar de capítulo (ou clicar num link), rola até a seção pedida ou até o topo do artigo.
  useEffect(() => {
    if (!chapters || !pending.key) return;
    const target = pending.anchor ? document.getElementById(anchorId(pending.anchor)) : articleRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [chapters, file, pending]);

  // No celular o índice vira uma faixa que rola para o lado: mantém o capítulo aberto à vista.
  useEffect(() => {
    document.querySelector(".help-index nav button.active")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [chapters, file]);

  const go: Go = (nextFile, anchor) => {
    if (nextFile && chapters?.some((chapter) => chapter.file === nextFile)) setFile(nextFile);
    setQuery("");
    setPending((current) => ({ anchor, key: current.key + 1 }));
  };

  const chapter = chapters?.find((entry) => entry.file === file) ?? chapters?.[0] ?? null;
  const hits = useMemo(() => (chapters && query.trim().length >= 2 ? searchManual(chapters, query) : []), [chapters, query]);
  const searching = query.trim().length >= 2;

  if (error) return <div className="alert error"><span>{error}</span></div>;
  if (!chapters || !chapter) return <div className="loading-list" aria-label="Carregando o manual"><span /><span /><span /></div>;

  return <div className="help-view">
    <aside className="help-index" aria-label="Capítulos do manual">
      <label className="search help-search"><Search size={17} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no manual..." aria-label="Buscar no manual" /></label>
      <nav>
        {chapters.map((entry) => <button key={entry.file} type="button" className={entry.file === chapter.file && !searching ? "active" : ""} aria-current={entry.file === chapter.file ? "page" : undefined} onClick={() => go(entry.file, null)}>{entry.title}</button>)}
      </nav>
    </aside>
    <article ref={articleRef} className="help-article">
      {searching ? <section aria-live="polite">
        <h1>Busca no manual</h1>
        {hits.length ? <ul className="help-hits">{hits.map((hit, index) => <li key={`${hit.file}-${hit.anchor}-${index}`}>
          <button type="button" onClick={() => go(hit.file, hit.anchor)}><strong>{hit.heading}</strong><small>{hit.chapter}</small>{hit.snippet && <span>{hit.snippet}</span>}</button>
        </li>)}</ul> : <div className="empty-state"><span><BookOpen /></span><h3>Nada encontrado</h3><p>Tente outras palavras, como o nome do botão ou da tela.</p></div>}
      </section> : chapter.blocks.map((block, index) => <Block key={`${chapter.file}-${index}`} block={block} go={go} />)}
    </article>
  </div>;
}
