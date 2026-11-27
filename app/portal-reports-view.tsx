"use client";

// Problemas e sugestões do Portal: a equipe relata (com print, se quiser) e acompanha; administradores
// mudam a situação e respondem. Abre pelo menu (Ajuda > Reportar problema), pelo "+ Criar" e pela busca.
import { useCallback, useEffect, useState } from "react";
import Bug from "lucide-react/icons/bug";
import ImagePlus from "lucide-react/icons/image-plus";
import Lightbulb from "lucide-react/icons/lightbulb";
import Plus from "lucide-react/icons/plus";
import Trash2 from "lucide-react/icons/trash-2";
import X from "lucide-react/icons/x";
import { uploadImage } from "./chat-thread";
import { useCreateRequest } from "./create-request";
import { useLiveRefresh } from "./live";
import { askConfirm } from "./confirm-dialog";
import { relativeTime, SegmentedControl } from "./task-shared";
import { MAX_REPORT_DETAILS, MAX_REPORT_TITLE, reportKindLabels, reportStatuses, reportStatusLabels, isOpenReport, type ReportKind, type ReportStatus } from "./portal-reports";

type Report = {
  id: number; kind: ReportKind; title: string; details: string; screen: string; device: string; status: ReportStatus; response: string;
  imageUrl: string | null; createdByName: string; mine: boolean; updatedByName: string | null; createdAt: string; updatedAt: string; canDelete: boolean;
};
type Data = { reports: Report[]; canManage: boolean };

async function send(payload: Record<string, unknown>) {
  const response = await fetch("/api/portal-reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Não foi possível salvar.");
  return data;
}

export default function PortalReportsView({ screen }: { screen: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<"open" | "closed">("open");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/portal-reports", { cache: "no-store" });
      const next = await response.json() as Data & { error?: string };
      if (!response.ok) throw new Error(next.error || "Não foi possível carregar os relatos.");
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os relatos.");
    }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  useLiveRefresh(load);
  useCreateRequest("report", () => setCreating(true));

  const open = data?.reports.filter((report) => isOpenReport(report.status)) ?? [];
  const closed = data?.reports.filter((report) => !isOpenReport(report.status)) ?? [];
  const shown = view === "open" ? open : closed;

  return <div className="portal-reports">
    <section className="portal-reports-intro">
      <span className="insight-icon"><Bug /></span>
      <div>
        <h2>Encontrou um erro ou tem uma ideia para o Portal?</h2>
        <p>{data?.canManage ? "Aqui chegam os relatos da equipe. Mude a situação e responda: quem relatou recebe o aviso no sino." : "Conte aqui, em vez de mandar no chat: fica registrado, quem cuida do Portal acompanha e você recebe o aviso quando for resolvido."}</p>
      </div>
      <button type="button" className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Reportar problema</button>
    </section>

    {error && <div className="alert error"><span>{error}</span><button onClick={() => setError("")} aria-label="Fechar aviso"><X size={16} /></button></div>}

    <div className="portal-reports-tabs" role="tablist" aria-label="Relatos">
      <button type="button" role="tab" aria-selected={view === "open"} className={view === "open" ? "active" : ""} onClick={() => setView("open")}>Abertos {open.length > 0 && <b>{open.length}</b>}</button>
      <button type="button" role="tab" aria-selected={view === "closed"} className={view === "closed" ? "active" : ""} onClick={() => setView("closed")}>Resolvidos e encerrados</button>
    </div>

    {!data ? <div className="loading-list" aria-label="Carregando relatos"><span /><span /></div>
      : shown.length === 0 ? <p className="portal-reports-empty">{view === "open" ? (data.canManage ? "Nenhum relato aberto. Tudo em dia." : "Você não tem relatos abertos.") : "Nada encerrado ainda."}</p>
      : <ul className="portal-reports-list">{shown.map((report) => <ReportCard key={report.id} report={report} canManage={data.canManage} onChanged={load} onError={setError} />)}</ul>}

    {creating && <ReportModal screen={screen} onClose={() => setCreating(false)} onCreated={async () => { setCreating(false); setView("open"); await load(); }} />}
  </div>;
}

function ReportCard({ report, canManage, onChanged, onError }: { report: Report; canManage: boolean; onChanged: () => Promise<void>; onError: (message: string) => void }) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [response, setResponse] = useState(report.response);
  const [saving, setSaving] = useState(false);
  const changed = status !== report.status || response.trim() !== report.response;

  async function save() {
    setSaving(true);
    try { await send({ action: "update", reportId: report.id, status, response }); await onChanged(); } catch (err) { onError(err instanceof Error ? err.message : "Não foi possível salvar."); } finally { setSaving(false); }
  }
  async function remove() {
    if (!(await askConfirm(`Tirar o relato "${report.title}"?`, { confirmLabel: "Tirar" }))) return;
    try { await send({ action: "delete", reportId: report.id }); await onChanged(); } catch (err) { onError(err instanceof Error ? err.message : "Não foi possível tirar."); }
  }

  return <li className={`portal-report ${report.status}`}>
    <div className="portal-report-head">
      <span className={`portal-report-kind ${report.kind}`}>{report.kind === "idea" ? <Lightbulb size={13} /> : <Bug size={13} />}{reportKindLabels[report.kind]}</span>
      <strong>{report.title}</strong>
      <span className={`portal-report-status ${report.status}`}>{reportStatusLabels[report.status]}</span>
    </div>
    {report.details && <p className="portal-report-details">{report.details}</p>}
    {report.imageUrl && <a className="portal-report-image" href={report.imageUrl} target="_blank" rel="noopener noreferrer" title="Abrir o print">{/* eslint-disable-next-line @next/next/no-img-element -- print vem da rota de mídia, sem otimização de servidor */}
      <img src={report.imageUrl} alt="Print enviado com o relato" loading="lazy" /></a>}
    <small className="portal-report-meta">{report.mine ? "Você" : report.createdByName} · {relativeTime(report.createdAt)}{report.screen && ` · tela ${report.screen}`}{canManage && report.device && <span title={report.device}> · {report.device.split(" · ")[0]}</span>}</small>
    {!canManage && report.response && <p className="portal-report-response"><b>{report.updatedByName ?? "Resposta"}:</b> {report.response}</p>}
    {canManage && <div className="portal-report-manage">
      <SegmentedControl label="Situação do relato" value={status} options={reportStatuses.map((value) => ({ value, label: reportStatusLabels[value] }))} onChange={(value) => setStatus(value)} />
      <textarea rows={2} maxLength={2000} value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Resposta para quem relatou (opcional): o que foi feito, quando sai…" aria-label="Resposta para quem relatou" />
      <div className="portal-report-actions">
        {report.canDelete && <button type="button" className="secondary-button" onClick={() => void remove()}><Trash2 size={14} /> Tirar</button>}
        <button type="button" className="primary-button" disabled={saving || !changed} onClick={() => void save()}>{saving ? "Salvando..." : "Salvar"}</button>
      </div>
    </div>}
    {!canManage && report.canDelete && <div className="portal-report-actions"><button type="button" className="secondary-button" onClick={() => void remove()}><Trash2 size={14} /> Tirar</button></div>}
  </li>;
}

export function ReportModal({ screen, onClose, onCreated }: { screen: string; onClose: () => void; onCreated: () => void | Promise<void> }) {
  const [kind, setKind] = useState<ReportKind>("bug");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [image, setImage] = useState<{ key: string; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function attach(file: File | null | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true); setError("");
    try { setImage(await uploadImage(file, "chat")); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível enviar o print."); } finally { setUploading(false); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    const device = `${navigator.userAgent.match(/(Edg|Chrome|Firefox|Safari)\/[\d.]+/)?.[0] ?? "Navegador"} · ${window.innerWidth}x${window.innerHeight}`;
    try { await send({ action: "create", kind, title, details, screen, device, imageKey: image?.key ?? null }); await onCreated(); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível enviar."); setSaving(false); }
  }

  return <div className="modal-layer"><button className="backdrop" onClick={onClose} aria-label="Fechar janela" />
    <form className="modal" onSubmit={submit} onPaste={(event) => { const file = [...event.clipboardData.files].find((entry) => entry.type.startsWith("image/")); if (file) { event.preventDefault(); void attach(file); } }}>
      <div className="modal-head"><div><h2>Reportar problema</h2><p>Quem cuida do Portal recebe o aviso. Você acompanha a situação em <b>Reportar problema</b>, no menu.</p></div><button type="button" onClick={onClose} aria-label="Fechar"><X /></button></div>
      <div className="form-grid">
        <div className="full"><SegmentedControl label="Tipo do relato" value={kind} options={[{ value: "bug" as ReportKind, label: "Erro ou algo estranho" }, { value: "idea" as ReportKind, label: "Sugestão de melhoria" }]} onChange={(value) => setKind(value)} /></div>
        <label className="full"><span>{kind === "idea" ? "Qual a ideia?" : "O que aconteceu?"}</span><input autoFocus required minLength={4} maxLength={MAX_REPORT_TITLE} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === "idea" ? "Ex.: filtrar demandas por cliente na Visão geral" : "Ex.: o botão Salvar não responde na licença"} /></label>
        <label className="full"><span>Detalhes <em>opcional</em></span><textarea rows={4} maxLength={MAX_REPORT_DETAILS} value={details} onChange={(event) => setDetails(event.target.value)} placeholder={kind === "idea" ? "Para que serviria, como você imagina…" : "O que você fez antes, o que esperava e o que apareceu. Dá para colar um print aqui (Ctrl+V)."} /></label>
        <div className="full portal-report-attach">
          {image ? <span className="portal-report-thumb">{/* eslint-disable-next-line @next/next/no-img-element -- prévia do print enviado */}
            <img src={image.url} alt="Print anexado" /><button type="button" onClick={() => setImage(null)} aria-label="Tirar o print"><X size={14} /></button></span>
            : <label className="secondary-button"><ImagePlus size={15} /> {uploading ? "Enviando print..." : "Anexar print"}<input type="file" accept="image/*" hidden onChange={(event) => void attach(event.target.files?.[0])} /></label>}
          {screen && <small>Tela: <b>{screen}</b></small>}
        </div>
      </div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={saving || uploading || title.trim().length < 4}>{saving ? "Enviando..." : "Enviar"}</button></div>
    </form>
  </div>;
}
