"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarClock from "lucide-react/icons/calendar-clock";
import LifeBuoy from "lucide-react/icons/life-buoy";
import ListTodo from "lucide-react/icons/list-todo";
import Sun from "lucide-react/icons/sun";
import Video from "lucide-react/icons/video";
import X from "lucide-react/icons/x";
import { isoToLocal, isMeetingJoinLink } from "./agenda";
import { expandAgenda, type AgendaEvent } from "./use-agenda";
import { dueState, nextWorkday, taskCode } from "./tasks";
import { postTask } from "./task-shared";
import Check from "lucide-react/icons/check";
import SkipForward from "lucide-react/icons/skip-forward";
import CalendarArrowUp from "lucide-react/icons/calendar-arrow-up";

const fullDay = (iso: string) => new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`)).replace(".", "");
import { ticketCode } from "./tickets";

const SEEN_KEY = "portal.myday.seen";
const OFF_KEY = "portal.myday.off";
const todayInSaoPaulo = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

type TaskRow = { id: number; title: string; status: string; dueDate: string | null; owners: number[]; support: number[] };
type TicketRow = { id: number; title: string; status: string; urgency: string; assigneeId: number | null };

function read(key: string) { try { return window.localStorage.getItem(key); } catch { return null; } }
function write(key: string, value: string | null) { try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); } catch { /* opcional */ } }

/** Abre sozinho na primeira visita do dia (a menos que a pessoa tenha desligado). */
export function useMyDayAutoOpen(ready: boolean) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      const today = todayInSaoPaulo();
      if (read(OFF_KEY) === "1" || read(SEEN_KEY) === today) return;
      write(SEEN_KEY, today);
      setOpen(true);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [ready]);
  return [open, setOpen] as const;
}

/** "Meu dia": agenda de hoje, demandas que vencem e chamados comigo. */
export default function MyDay({ name, agenda, onClose, onOpenTask, onOpenTicket, onOpenAgenda }: { name: string; agenda: AgendaEvent[]; onClose: () => void; onOpenTask: (id: number) => void; onOpenTicket: (id: number) => void; onOpenAgenda: (id?: number) => void }) {
  const [tasks, setTasks] = useState<TaskRow[] | null>(null);
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);
  const [meId, setMeId] = useState<number | null>(null);
  const [off, setOff] = useState(() => read(OFF_KEY) === "1");
  const [review, setReview] = useState<{ done: number[]; postponed: number[]; skipped: number[] } | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const today = todayInSaoPaulo();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [taskResponse, ticketResponse] = await Promise.all([fetch("/api/tasks", { cache: "no-store" }), fetch("/api/tickets", { cache: "no-store" })]);
        const taskData = taskResponse.ok ? await taskResponse.json() as { tasks: TaskRow[]; me: { id: number } } : null;
        const ticketData = ticketResponse.ok ? await ticketResponse.json() as { tickets: TicketRow[] } : null;
        if (cancelled) return;
        setMeId(taskData?.me.id ?? null);
        setTasks(taskData?.tasks ?? []);
        setTickets(ticketData?.tickets ?? []);
      } catch {
        if (!cancelled) { setTasks([]); setTickets([]); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dayStart = Date.parse(`${today}T00:00:00-03:00`);
  const events = useMemo(() => expandAgenda(agenda, dayStart, dayStart + 86400000 - 1).filter((event) => !event.done), [agenda, dayStart]);
  const myTasks = useMemo(() => (tasks ?? []).filter((task) => meId !== null && (task.owners.includes(meId) || task.support.includes(meId)) && !["done", "canceled"].includes(task.status) && task.dueDate && task.dueDate <= today)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")), [tasks, meId, today]);
  const myTickets = useMemo(() => (tickets ?? []).filter((ticket) => meId !== null && ticket.assigneeId === meId && ["open", "in_progress", "waiting"].includes(ticket.status)), [tickets, meId]);
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(new Date()));
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const go = (action: () => void) => { onClose(); action(); };
  const loading = tasks === null || tickets === null;
  const calm = !loading && !events.length && !myTasks.length && !myTickets.length;

  // "Revisar uma por vez": passa pelas demandas que vencem, uma de cada vez (concluir, adiar ou pular).
  const handled = review ? new Set([...review.done, ...review.postponed, ...review.skipped]) : new Set<number>();
  const current = review ? myTasks.find((task) => !handled.has(task.id)) ?? null : null;
  async function decide(kind: "done" | "postponed" | "skipped") {
    if (!review || !current) return;
    setReviewError("");
    if (kind !== "skipped") {
      setReviewBusy(true);
      try { await postTask(kind === "done" ? { action: "updateTask", taskId: current.id, status: "done" } : { action: "updateTask", taskId: current.id, dueDate: nextWorkday(today) }); }
      catch (err) { setReviewError(err instanceof Error ? err.message : "Não foi possível salvar."); setReviewBusy(false); return; }
      setReviewBusy(false);
    }
    setReview({ ...review, [kind]: [...review[kind], current.id] });
  }
  function renderReview() {
    if (!review) return null;
    const total = myTasks.length;
    if (!current) return <div className="my-day-review done">
      <h3>Pronto!</h3>
      <p>{[review.done.length && `${review.done.length} concluída${review.done.length === 1 ? "" : "s"}`, review.postponed.length && `${review.postponed.length} adiada${review.postponed.length === 1 ? "" : "s"} para ${fullDay(nextWorkday(today))}`, review.skipped.length && `${review.skipped.length} para depois`].filter(Boolean).join(", ") || "Nada mudou."}</p>
      <button type="button" className="secondary-button" onClick={() => { setReview(null); setTasks((list) => list && list.map((task) => review.done.includes(task.id) ? { ...task, status: "done" } : review.postponed.includes(task.id) ? { ...task, dueDate: nextWorkday(today) } : task)); }}>Voltar ao resumo</button>
    </div>;
    const state = dueState(current.dueDate!, today);
    return <div className="my-day-review" aria-live="polite">
      <small>{handled.size + 1} de {total}</small>
      <article>
        <span className={`my-day-review-due ${state === "overdue" ? "late" : ""}`}>{state === "overdue" ? `Venceu em ${fullDay(current.dueDate!)}` : "Vence hoje"}</span>
        <strong>{current.title}</strong>
        <button type="button" className="my-day-review-open" onClick={() => go(() => onOpenTask(current.id))}>{taskCode(current.id)} · abrir a demanda</button>
      </article>
      {reviewError && <p className="my-day-review-error" role="alert">{reviewError}</p>}
      <div className="my-day-review-actions">
        <button type="button" className="secondary-button" disabled={reviewBusy} onClick={() => void decide("postponed")}><CalendarArrowUp size={15} /> Adiar para {fullDay(nextWorkday(today))}</button>
        <button type="button" className="secondary-button" disabled={reviewBusy} onClick={() => void decide("skipped")}><SkipForward size={15} /> Próxima</button>
        <button type="button" className="primary-button" disabled={reviewBusy} onClick={() => void decide("done")}><Check size={15} /> Concluir</button>
      </div>
      <button type="button" className="my-day-review-back" onClick={() => setReview(null)}>Voltar ao resumo</button>
    </div>;
  }

  return <div className="modal-layer"><button className="backdrop" onClick={onClose} aria-label="Fechar" /><section className="modal my-day" role="dialog" aria-label="Meu dia">
    <div className="my-day-head">
      <span className="my-day-sun"><Sun size={22} /></span>
      <div><h2>{greeting}, {name.split(/\s+/)[0]}!</h2><p>{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date())}</p></div>
      <button type="button" className="my-day-close" onClick={onClose} aria-label="Fechar"><X /></button>
    </div>
    <div className="my-day-body">
      {review ? renderReview() : loading ? <div className="loading-list"><span /><span /></div> : calm ? <p className="my-day-calm">Nada marcado para hoje: sem compromissos, prazos vencendo ou chamados com você. Bom trabalho!</p> : <>
        {events.length > 0 && <div className="my-day-block">
          <h3><CalendarClock size={15} /> Agenda de hoje</h3>
          <ul>{events.map((event) => <li key={`${event.id}-${event.startsAt}`}><button onClick={() => go(() => onOpenAgenda(event.id))}><b>{isoToLocal(event.startsAt).time}</b><span>{event.title}</span></button>{isMeetingJoinLink(event.teamsUrl) && <a href={event.teamsUrl} target="_blank" rel="noopener noreferrer"><Video size={13} /> Entrar</a>}</li>)}</ul>
        </div>}
        {myTasks.length > 0 && <div className="my-day-block">
          <h3><ListTodo size={15} /> Demandas que vencem<button type="button" className="my-day-review-start" onClick={() => { setReview({ done: [], postponed: [], skipped: [] }); setReviewError(""); }}>Revisar uma por vez</button></h3>
          <ul>{myTasks.slice(0, 6).map((task) => { const state = dueState(task.dueDate!, today); return <li key={task.id}><button onClick={() => go(() => onOpenTask(task.id))}><b className={state === "overdue" ? "late" : ""}>{state === "overdue" ? "vencida" : "hoje"}</b><span>{taskCode(task.id)} · {task.title}</span></button></li>; })}{myTasks.length > 6 && <li className="more">e mais {myTasks.length - 6}</li>}</ul>
        </div>}
        {myTickets.length > 0 && <div className="my-day-block">
          <h3><LifeBuoy size={15} /> Chamados com você</h3>
          <ul>{myTickets.slice(0, 6).map((ticket) => <li key={ticket.id}><button onClick={() => go(() => onOpenTicket(ticket.id))}><b className={ticket.urgency === "critical" || ticket.urgency === "high" ? "late" : ""}>{ticketCode(ticket.id)}</b><span>{ticket.title}</span></button></li>)}{myTickets.length > 6 && <li className="more">e mais {myTickets.length - 6}</li>}</ul>
        </div>}
      </>}
    </div>
    <div className="my-day-foot">
      <label><input type="checkbox" checked={off} onChange={(event) => { setOff(event.target.checked); write(OFF_KEY, event.target.checked ? "1" : null); }} /> Não abrir sozinho (fica no botão “Meu dia” da Visão geral)</label>
      <button className="primary-button" onClick={onClose}>Começar o dia</button>
    </div>
  </section></div>;
}
