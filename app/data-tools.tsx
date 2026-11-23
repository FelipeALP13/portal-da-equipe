"use client";

// Botão "Importar / Exportar" no topo das telas de registro: exporta, baixa o modelo e importa com prévia.
import { useEffect, useRef, useState } from "react";
import ArrowDownUp from "lucide-react/icons/arrow-down-up";
import Download from "lucide-react/icons/download";
import FileSpreadsheet from "lucide-react/icons/file-spreadsheet";
import FileText from "lucide-react/icons/file-text";
import Upload from "lucide-react/icons/upload";
import X from "lucide-react/icons/x";
import { browserInflateRaw, readXlsx } from "./xlsx-reader";
import { DATA_SETS, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, mapSheet, parseCsv, SCREEN_DATA, type DataSetKey, type SheetRow } from "./data-transfer";

type Access = Record<string, { export: boolean; import: boolean }>;
type Summary = { create: number; update: number; skip: number; errors: number };
type Preview = { summary: Summary; errors: { line: number; message: string }[]; canUpdate: boolean };

let accessCache: Promise<Access | null> | null = null;
function loadAccess() {
  accessCache ??= fetch("/api/data?access=1", { cache: "no-store" }).then(async (response) => (response.ok ? ((await response.json()) as { access: Access }).access : null)).catch(() => null);
  return accessCache;
}

async function download(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(((await response.json().catch(() => ({}))) as { error?: string }).error || "Não foi possível gerar o arquivo.");
  const name = response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "dados.xlsx";
  const link = document.createElement("a");
  link.href = URL.createObjectURL(await response.blob());
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

export function DataToolsButton({ screen, onImported }: { screen: string; onImported: () => void }) {
  const [access, setAccess] = useState<Access | null>(null);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState<DataSetKey | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { let alive = true; void loadAccess().then((value) => { if (alive) setAccess(value); }); return () => { alive = false; }; }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  const sets = (SCREEN_DATA[screen] ?? []).filter((key) => access?.[key]?.export || access?.[key]?.import);
  if (!sets.length) return null;

  async function get(key: DataSetKey, format: "xlsx" | "csv" | "template") {
    setBusy(`${key}-${format}`); setError("");
    try { await download(`/api/data?dataset=${key}&format=${format}`); setOpen(false); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível gerar o arquivo."); }
    finally { setBusy(""); }
  }

  return <div className="data-tools" ref={ref}>
    <button type="button" className="data-tools-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)} title="Importar e exportar planilhas"><ArrowDownUp size={16} /><span>Importar / Exportar</span></button>
    {open && <div className="data-tools-pop" role="menu">
      {sets.map((key) => <section key={key}>
        <h4>{DATA_SETS[key].label}</h4>
        {access?.[key]?.export && <>
          <button type="button" role="menuitem" disabled={Boolean(busy)} onClick={() => void get(key, "xlsx")}><FileSpreadsheet size={15} /> {busy === `${key}-xlsx` ? "Gerando..." : "Exportar Excel"}</button>
          <button type="button" role="menuitem" disabled={Boolean(busy)} onClick={() => void get(key, "csv")}><FileText size={15} /> {busy === `${key}-csv` ? "Gerando..." : "Exportar CSV"}</button>
        </>}
        {access?.[key]?.import && <>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); setImporting(key); }}><Upload size={15} /> Importar planilha</button>
          <button type="button" role="menuitem" disabled={Boolean(busy)} onClick={() => void get(key, "template")}><Download size={15} /> {busy === `${key}-template` ? "Gerando..." : "Baixar modelo"}</button>
        </>}
      </section>)}
      {error && <p className="modal-error">{error}</p>}
    </div>}
    {importing && <ImportDialog dataset={importing} onClose={() => setImporting(null)} onDone={onImported} />}
  </div>;
}

async function readFile(file: File, dataset: DataSetKey) {
  if (file.size > MAX_IMPORT_BYTES) throw new Error("O arquivo passa de 5 MB.");
  const name = file.name.toLowerCase();
  let sheets: string[][][];
  if (name.endsWith(".csv")) sheets = [parseCsv(await file.text())];
  else if (name.endsWith(".xlsx")) sheets = (await readXlsx(new Uint8Array(await file.arrayBuffer()), browserInflateRaw)).map((sheet) => sheet.rows);
  else throw new Error("Use um arquivo .xlsx ou .csv.");
  // A aba com mais colunas reconhecidas (o modelo tem também a aba "Como preencher").
  const mapped = sheets.map((sheet) => mapSheet(dataset, sheet)).sort((a, b) => b.found.length - a.found.length)[0];
  if (!mapped?.found.length) throw new Error("Não reconheci as colunas. Baixe o modelo e use os mesmos títulos.");
  if (mapped.missing.length) throw new Error(`Faltam as colunas: ${mapped.missing.join(", ")}.`);
  if (!mapped.rows.length) throw new Error("A planilha não tem linhas preenchidas.");
  if (mapped.rows.length > MAX_IMPORT_ROWS) throw new Error(`A planilha tem ${mapped.rows.length} linhas. Importe no máximo ${MAX_IMPORT_ROWS} por vez.`);
  return mapped;
}

function ImportDialog({ dataset, onClose, onDone }: { dataset: DataSetKey; onClose: () => void; onDone: () => void }) {
  const set = DATA_SETS[dataset];
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [update, setUpdate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Summary | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function send(nextRows: SheetRow[], nextUpdate: boolean, commit: boolean) {
    const response = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataset, rows: nextRows, update: nextUpdate, commit }) });
    const data = await response.json() as Preview & { error?: string; done?: boolean };
    if (!response.ok && !data.errors) throw new Error(data.error || "Não foi possível importar.");
    return data;
  }
  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true); setError(""); setPreview(null); setDone(null);
    try {
      const mapped = await readFile(file, dataset);
      setFileName(file.name); setRows(mapped.rows);
      setPreview(await send(mapped.rows, update, false));
    } catch (err) { setRows([]); setFileName(""); setError(err instanceof Error ? err.message : "Não foi possível ler o arquivo."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  async function toggleUpdate(value: boolean) {
    setUpdate(value);
    if (!rows.length) return;
    setBusy(true); setError("");
    try { setPreview(await send(rows, value, false)); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível conferir."); } finally { setBusy(false); }
  }
  async function confirm() {
    setBusy(true); setError("");
    try {
      const result = await send(rows, update, true);
      if (!result.summary || !(result as { done?: boolean }).done) { setPreview(result); throw new Error((result as { error?: string }).error || "Corrija as linhas com erro."); }
      setDone(result.summary); onDone();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível importar."); }
    finally { setBusy(false); }
  }

  const s = preview?.summary;
  const writes = (s?.create ?? 0) + (s?.update ?? 0);
  return <div className="modal-layer"><button className="backdrop" onClick={onClose} aria-label="Fechar janela" /><div className="modal data-import" role="dialog" aria-label={`Importar ${set.label}`}>
    <div className="modal-head"><div><h2>Importar {set.label.toLocaleLowerCase("pt-BR")}</h2><p>Nada é gravado antes de você conferir a prévia. A importação nunca apaga registros.</p></div><button type="button" onClick={onClose} aria-label="Fechar"><X /></button></div>
    <div className="data-import-body">
      {done ? <div className="data-import-done"><strong>Importação concluída</strong><p>{done.create} novos · {done.update} atualizados · {done.skip} ignorados</p></div> : <>
        <input ref={input} type="file" accept=".xlsx,.csv" hidden onChange={(event) => void pick(event.target.files?.[0])} />
        <button type="button" className="data-import-drop" disabled={busy} onClick={() => input.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void pick(event.dataTransfer.files[0]); }}>
          <Upload size={20} /><strong>{fileName || "Escolher planilha"}</strong><small>{busy ? "Conferindo..." : fileName ? `${rows.length} linhas lidas · clique para trocar` : "Excel (.xlsx) ou CSV, até 5 MB. Pode arrastar para cá."}</small>
        </button>
        {set.match && <p className="muted data-import-hint">{set.match}</p>}
        {preview && <>
          <div className="data-import-stats">
            <span className="new"><b>{s!.create}</b> novos</span><span className="upd"><b>{s!.update}</b> atualizar</span><span><b>{s!.skip}</b> já existem</span><span className={s!.errors ? "bad" : ""}><b>{s!.errors}</b> com erro</span>
          </div>
          {preview.canUpdate && <label className="data-import-check"><input type="checkbox" checked={update} disabled={busy} onChange={(event) => void toggleUpdate(event.target.checked)} /> Atualizar os registros que já existem (células vazias não apagam nada)</label>}
          {preview.errors.length > 0 && <div className="data-import-errors"><strong>Corrija na planilha e envie de novo:</strong><ul>{preview.errors.map((entry) => <li key={entry.line}><b>Linha {entry.line}</b> {entry.message}</li>)}</ul>{s!.errors > preview.errors.length && <small>e mais {s!.errors - preview.errors.length}.</small>}</div>}
        </>}
      </>}
      {error && <p className="modal-error">{error}</p>}
    </div>
    <div className="modal-actions">
      <button type="button" className="secondary-button" onClick={onClose}>{done ? "Fechar" : "Cancelar"}</button>
      {!done && <button type="button" className="primary-button" disabled={busy || !preview || s!.errors > 0 || writes === 0} onClick={() => void confirm()}>{busy ? "Aguarde..." : writes ? `Importar ${writes} ${writes === 1 ? "registro" : "registros"}` : "Importar"}</button>}
    </div>
  </div></div>;
}
