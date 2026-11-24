"use client";

// Demandas na semana: cada dia dividido em qualquer hora, manhã e tarde. Arrastar um cartão muda o prazo.
import { useMemo, useState } from "react";
import ChevronLeft from "lucide-react/icons/chevron-left";
import ChevronRight from "lucide-react/icons/chevron-right";
import Plus from "lucide-react/icons/plus";
import { addDaysIso, isClosedStatus, taskCode, taskDuePeriodLabels, weekDays, weekStart, type TaskDuePeriod } from "./tasks";
import { type Lookups, type Task, AvatarStack, DueChip, PriorityIcon } from "./task-shared";

type Slot = TaskDuePeriod | "any";
const SLOTS: { key: Slot; label: string }[] = [{ key: "any", label: "Qualquer hora" }, { key: "morning", label: taskDuePeriodLabels.morning }, { key: "afternoon", label: taskDuePeriodLabels.afternoon }];
const TRAY_LIMIT = 40;
const rank = (task: Task) => (task.priority === 0 ? 5 : task.priority);
const byPriority = (a: Task, b: Task) => rank(a) - rank(b) || a.sortOrder - b.sortOrder || b.id - a.id;
const dayName = (date: string, style: "short" | "long") => new Intl.DateTimeFormat("pt-BR", { weekday: style, timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)).replace(".", "");
const dayNumber = (date: string) => Number(date.slice(8));
const rangeLabel = (start: string) => {
  const format = (date: string) => new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)).replace(".", "").replace(" de ", " ");
  return `${format(start)} a ${format(addDaysIso(start, 6))}`;
};

export function TaskWeek({ tasks, lookups, canEdit, today, onOpen, onReschedule, onCreate }: { tasks: Task[]; lookups: Lookups; canEdit: boolean; today: string; onOpen: (id: number) => void; onReschedule: (taskId: number, dueDate: string | null, duePeriod: TaskDuePeriod | null) => void; onCreate: (dueDate: string, duePeriod: TaskDuePeriod | null) => void }) {
  const [start, setStart] = useState(() => weekStart(today));
  const [day, setDay] = useState(today);
  const [tray, setTray] = useState<"late" | "none" | null>(() => (window.matchMedia("(max-width: 760px)").matches ? null : "late"));
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const days = useMemo(() => weekDays(start), [start]);
  const activeDay = days.includes(day) ? day : days[0];

  const open = useMemo(() => tasks.filter((task) => !isClosedStatus(task.status)), [tasks]);
  const late = useMemo(() => open.filter((task) => task.dueDate && task.dueDate < today).sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "") || byPriority(a, b)), [open, today]);
  const undated = useMemo(() => open.filter((task) => !task.dueDate).sort(byPriority), [open]);
  const cells = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of open) {
      if (!task.dueDate || !days.includes(task.dueDate)) continue;
      const key = `${task.dueDate}:${task.duePeriod ?? "any"}`;
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    for (const list of map.values()) list.sort(byPriority);
    return map;
  }, [open, days]);
  const trayTasks = tray === "late" ? late : tray === "none" ? undated : [];

  const finish = () => { setDragId(null); setOver(null); };
  const dropZone = (key: string, apply: (taskId: number) => void) => canEdit ? {
    onDragOver: (event: React.DragEvent) => { if (dragId === null) return; event.preventDefault(); if (over !== key) setOver(key); },
    onDrop: (event: React.DragEvent) => { event.preventDefault(); if (dragId !== null) apply(dragId); finish(); },
  } : {};
  const card = (task: Task, showDue = false) => {
    const client = task.clientId ? lookups.clientsById.get(task.clientId) : null;
    return <button key={task.id} type="button" className={`week-card ${dragId === task.id ? "dragging" : ""} ${task.dueDate && task.dueDate < today ? "late" : ""}`} draggable={canEdit} onClick={() => onOpen(task.id)}
      onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(task.id)); setDragId(task.id); }} onDragEnd={finish}>
      <span className="week-card-title">{task.title}</span>
      {client && <span className="week-card-client">{client.name}</span>}
      <span className="week-card-meta"><PriorityIcon priority={task.priority} /><span className="task-code">{taskCode(task.id)}</span>{showDue && task.dueDate && <DueChip dueDate={task.dueDate} closed={false} today={today} />}<AvatarStack ids={task.owners} membersById={lookups.membersById} size={20} /></span>
    </button>;
  };

  return <div className="task-week">
    <div className="week-bar">
      <div className="week-nav">
        <button type="button" onClick={() => setStart(addDaysIso(start, -7))} aria-label="Semana anterior"><ChevronLeft size={16} /></button>
        <strong aria-live="polite">{rangeLabel(start)}</strong>
        <button type="button" onClick={() => setStart(addDaysIso(start, 7))} aria-label="Próxima semana"><ChevronRight size={16} /></button>
        {start !== weekStart(today) && <button type="button" className="week-today" onClick={() => { setStart(weekStart(today)); setDay(today); }}>Esta semana</button>}
      </div>
      <div className="week-tray-tabs" role="group" aria-label="Demandas fora da semana">
        <button type="button" aria-pressed={tray === "late"} className={`${tray === "late" ? "active" : ""} ${late.length ? "has-late" : ""}`} onClick={() => setTray(tray === "late" ? null : "late")}>Atrasadas <b>{late.length}</b></button>
        <button type="button" aria-pressed={tray === "none"} className={`${tray === "none" ? "active" : ""} ${over === "tray-none" ? "drop" : ""}`} onClick={() => setTray(tray === "none" ? null : "none")} {...dropZone("tray-none", (id) => onReschedule(id, null, null))}>Sem prazo <b>{undated.length}</b></button>
      </div>
    </div>

    {tray && <section className={`week-tray ${over === "tray-none" ? "drop" : ""}`} aria-label={tray === "late" ? "Demandas atrasadas" : "Demandas sem prazo"} {...(tray === "none" ? dropZone("tray-none", (id) => onReschedule(id, null, null)) : {})}>
      {trayTasks.length ? <div className="week-tray-cards">{trayTasks.slice(0, TRAY_LIMIT).map((task) => card(task, tray === "late"))}</div> : <p>{tray === "late" ? "Nenhuma demanda atrasada." : "Toda demanda em aberto tem prazo."}</p>}
      {trayTasks.length > TRAY_LIMIT && <small>Mostrando {TRAY_LIMIT} de {trayTasks.length}. Use a busca ou os filtros para encontrar as outras.</small>}
    </section>}

    <div className="week-days" role="group" aria-label="Escolher o dia">
      {days.map((date) => <button key={date} type="button" className={`${date === activeDay ? "active" : ""} ${date === today ? "today" : ""}`} aria-pressed={date === activeDay} onClick={() => setDay(date)}><small>{dayName(date, "short")}</small><b>{dayNumber(date)}</b></button>)}
    </div>

    <div className="week-grid">
      {days.map((date) => {
        const total = SLOTS.reduce((sum, slot) => sum + (cells.get(`${date}:${slot.key}`)?.length ?? 0), 0);
        return <section key={date} className={`week-column ${date === today ? "today" : ""} ${date === activeDay ? "is-active" : ""}`} aria-label={`${dayName(date, "long")}, dia ${dayNumber(date)}`}>
          <header><span>{dayName(date, "short")}</span><b>{dayNumber(date)}</b>{total > 0 && <small>{total}</small>}</header>
          {SLOTS.map((slot) => {
            const key = `${date}:${slot.key}`;
            const period = slot.key === "any" ? null : slot.key;
            const list = cells.get(key) ?? [];
            return <div key={key} className={`week-slot ${over === key ? "drop" : ""}`} {...dropZone(key, (id) => onReschedule(id, date, period))}>
              <div className="week-slot-head"><span>{slot.label}</span>{canEdit && <button type="button" onClick={() => onCreate(date, period)} aria-label={`Nova demanda em ${dayName(date, "long")}, ${slot.label}`} title="Nova demanda aqui"><Plus size={13} /></button>}</div>
              {list.map((task) => card(task))}
            </div>;
          })}
        </section>;
      })}
    </div>
  </div>;
}
