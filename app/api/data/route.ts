// Importar e exportar registros por planilha, com as permissões de cada conjunto.
// A importação sempre passa por uma prévia, nunca apaga nada e célula vazia não sobrescreve o que já existe.
import { eq, min } from "drizzle-orm";
import { getDb } from "../../../db";
import { absences, assets, clients, incidents, items, kbArticles, maintenanceRequests, members, movements, projects, supportTeams, supportWeeks, taskEvents, taskPeople, tasks, teams, ticketEvents, tickets, timeEntries } from "../../../db/schema";
import { getSessionMember, type SessionMember } from "../../auth-session";
import { hasTrustedOrigin } from "../../request-security";
import { readJsonBody } from "../../api-input";
import { writeAudit } from "../../audit";
import { hasPermission } from "../../member-permissions";
import { buildXlsx, type CellValue, type Column } from "../../xlsx-writer";
import { localDay, toCsv } from "../../export-data";
import { dataFields, DATA_SETS, foldText, importFields, isDataSet, MAX_IMPORT_ROWS, readCell, templateGuide, type DataSetKey, type SheetRow } from "../../data-transfer";
import { absenceKindLabels } from "../../absences";
import { isRealEmail } from "../../agenda";
import { severityLabels, incidentStatusLabels } from "../../people-tools";
import { maintenancePriorityLabels, maintenanceStatusLabels } from "../../maintenance-tools";
import { taskCode } from "../../tasks";
import { ticketCode, ticketStatusLabels } from "../../tickets";

type Db = ReturnType<typeof getDb>;
type Values = Record<string, string | number | boolean | null>;
type Plan = { line: number; action: "create" | "update" | "skip"; id?: number; insert?: Values; update?: Values; label: string; assigneeId?: number | null };

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const ROLE_LABELS: Record<string, string> = { admin: "Administrador", member: "Membro", viewer: "Somente leitura" };
const MOVEMENT_LABELS: Record<string, string> = { purchase: "Compra", open: "Abertura", consume: "Consumo", adjust: "Ajuste" };
const ABSENCE_STATUS: Record<string, string> = { approved: "Aprovada", pending: "Pendente", rejected: "Recusada" };

/** Dados pessoais, custos e horas: só administradores. O resto segue o que a pessoa já vê na tela. */
function canExport(member: SessionMember, key: DataSetKey) {
  if (member.role === "admin") return true;
  if (key === "tasks" || key === "tickets" || key === "projects" || key === "knowledge" || key === "schedule" || key === "items") return true;
  if (key === "movements") return hasPermission(member, "viewHistory");
  if (key === "maintenance") return hasPermission(member, "manageOffice");
  return false;
}

function canImport(member: SessionMember, key: DataSetKey) {
  if (!DATA_SETS[key].importable) return false;
  if (member.role === "admin") return true;
  return key === "items" && hasPermission(member, "manageItems");
}

async function lookups(db: Db) {
  const [people, teamRows, clientRows, projectRows] = await Promise.all([
    db.select({ id: members.id, name: members.name, email: members.email }).from(members),
    db.select({ id: teams.id, name: teams.name }).from(teams),
    db.select({ id: clients.id, name: clients.name }).from(clients),
    db.select({ id: projects.id, name: projects.name }).from(projects),
  ]);
  const nameOf = <T extends { id: number; name: string }>(rows: T[], id: number | null) => (id ? rows.find((row) => row.id === id)?.name ?? "" : "");
  const idBy = (rows: { id: number; name: string }[]) => {
    const map = new Map<string, number | "ambiguous">();
    for (const row of rows) { const key = foldText(row.name); map.set(key, map.has(key) ? "ambiguous" : row.id); }
    return map;
  };
  const personByName = idBy(people);
  const personByEmail = new Map(people.map((row) => [foldText(row.email), row.id]));
  return {
    people, teamRows, clientRows, projectRows,
    person: (id: number | null) => nameOf(people, id), team: (id: number | null) => nameOf(teamRows, id), client: (id: number | null) => nameOf(clientRows, id), project: (id: number | null) => nameOf(projectRows, id),
    teamId: idBy(teamRows), clientId: idBy(clientRows), projectId: idBy(projectRows),
    personId: (value: string) => personByEmail.get(foldText(value)) ?? personByName.get(foldText(value)),
  };
}
type Lookups = Awaited<ReturnType<typeof lookups>>;

/** Linhas de cada conjunto para a planilha, com as mesmas colunas do modelo de importação. */
async function exportRows(db: Db, key: DataSetKey, look: Lookups): Promise<Record<string, CellValue>[]> {
  const label = (options: Record<string, string>, value: string) => options[value] ?? value;
  if (key === "tasks") return (await db.select().from(tasks)).map((row) => ({ code: taskCode(row.id), title: row.title, status: label(DATA_SETS.tasks.fields[2].options as Record<string, string>, row.status), priority: label(DATA_SETS.tasks.fields[3].options as Record<string, string>, String(row.priority)), team: look.team(row.teamId), client: look.client(row.clientId), project: look.project(row.projectId), assignee: look.person(row.assigneeId), category: row.category, openedOn: localDay(row.openedOn ?? row.createdAt), startDate: row.startDate, dueDate: row.dueDate, estimatedHours: row.estimatedHours, description: row.description }));
  if (key === "hours") {
    const taskRows = await db.select({ id: tasks.id, title: tasks.title, clientId: tasks.clientId }).from(tasks);
    return (await db.select().from(timeEntries)).map((row) => { const task = taskRows.find((entry) => entry.id === row.taskId); return { workDate: row.workDate, person: row.memberName, hours: row.hours, code: taskCode(row.taskId), title: task?.title ?? "", client: look.client(task?.clientId ?? null) }; });
  }
  if (key === "tickets") return (await db.select().from(tickets)).map((row) => ({ code: ticketCode(row.id), title: row.title, type: label(DATA_SETS.tickets.fields[2].options as Record<string, string>, row.type), urgency: label(DATA_SETS.tickets.fields[3].options as Record<string, string>, row.urgency), client: row.client, team: look.team(row.teamId), assignee: look.person(row.assigneeId), description: row.description, statusLabel: label(ticketStatusLabels, row.status), createdOn: localDay(row.createdAt) }));
  if (key === "projects") return (await db.select().from(projects)).map((row) => ({ name: row.name, client: look.client(row.clientId), farol: label(DATA_SETS.projects.fields[2].options as Record<string, string>, row.farol), phase: label(DATA_SETS.projects.fields[3].options as Record<string, string>, row.phase), deadlineLabel: row.deadlineLabel, startDate: row.startDate, endForecast: row.endForecast, description: row.description, notes: row.notes }));
  if (key === "clients") return (await db.select().from(clients)).map((row) => ({ name: row.name, contactName: row.contactName, contactEmail: row.contactEmail, contactPhone: row.contactPhone, monthlyHours: row.monthlyHours, active: row.active ? "Sim" : "Não", notes: row.notes }));
  if (key === "incidents") return (await db.select().from(incidents)).map((row) => ({ title: row.title, client: look.client(row.clientId), severity: severityLabels[row.severity], status: incidentStatusLabels[row.status], startedOn: localDay(row.startedAt), resolvedOn: localDay(row.resolvedAt), impact: row.impact, cause: row.cause, resolution: row.resolution, prevention: row.prevention }));
  if (key === "knowledge") return (await db.select().from(kbArticles)).map((row) => ({ title: row.title, client: look.client(row.clientId), team: look.team(row.teamId), tags: row.tags, body: row.body }));
  if (key === "schedule") {
    const crews = await db.select().from(supportTeams);
    const names = (value: string) => { try { return (JSON.parse(value) as string[]).join(", "); } catch { return ""; } };
    return (await db.select().from(supportWeeks)).sort((a, b) => a.startDate.localeCompare(b.startDate)).map((row) => { const crew = crews.find((entry) => entry.id === row.teamId); return { startDate: row.startDate, endDate: row.endDate, team: crew?.name ?? "", people: names(crew?.members ?? "[]"), note: row.note }; });
  }
  if (key === "people") return (await db.select({ name: members.name, email: members.email, jobTitle: members.jobTitle, phone: members.phone, birthday: members.birthday, startedOn: members.startedOn, role: members.role, active: members.active }).from(members)).map((row) => ({ name: row.name, email: /@pendente\.local$/i.test(row.email) ? "" : row.email, jobTitle: row.jobTitle, phone: row.phone, birthday: row.birthday ? `${row.birthday.slice(3)}/${row.birthday.slice(0, 2)}` : "", startedOn: row.startedOn, roleLabel: ROLE_LABELS[row.role] ?? row.role, activeLabel: row.active ? "Ativo" : "Inativo" }));
  if (key === "absences") return (await db.select().from(absences)).map((row) => ({ person: look.person(row.memberId), kind: absenceKindLabels[row.kind], startDate: row.startDate, endDate: row.endDate, note: row.note, statusLabel: ABSENCE_STATUS[row.status] ?? row.status }));
  if (key === "assets") return (await db.select().from(assets)).map((row) => ({ kind: label(DATA_SETS.assets.fields[0].options as Record<string, string>, row.kind), name: row.name, category: row.category, identifier: row.identifier, status: label(DATA_SETS.assets.fields[4].options as Record<string, string>, row.status), seats: row.seats, purchaseDate: row.purchaseDate, expiresOn: row.expiresOn, cost: row.cost, notes: row.notes }));
  if (key === "maintenance") return (await db.select().from(maintenanceRequests)).map((row) => ({ code: row.id, title: row.title, location: row.location, priority: maintenancePriorityLabels[row.priority], status: maintenanceStatusLabels[row.status], requester: row.createdByName, assignee: look.person(row.assigneeId), createdOn: localDay(row.createdAt), resolvedOn: localDay(row.resolvedAt) }));
  if (key === "items") return (await db.select().from(items)).map((row) => ({ name: row.name, category: row.category, unit: row.unit, minimumQty: row.minimumQty, scanCode: row.scanCode, unopenedQty: row.unopenedQty, openedQty: row.openedQty }));
  const itemRows = await db.select({ id: items.id, name: items.name }).from(items);
  return (await db.select().from(movements)).map((row) => ({ day: localDay(row.createdAt), item: itemRows.find((item) => item.id === row.itemId)?.name ?? "", type: MOVEMENT_LABELS[row.type] ?? row.type, quantity: row.quantity, person: row.createdByName ?? "", note: row.note }));
}

/** CSV seguro no Excel; números e textos como vieram. */
function tableOf(key: DataSetKey, rows: Record<string, CellValue>[]) {
  const fields = dataFields(key);
  const columns: Column[] = fields.map((field) => ({ header: field.header, width: field.width, type: field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text" }));
  return { columns, rows: rows.map((row) => fields.map((field) => row[field.key] ?? null)) };
}

export async function GET(request: Request) {
  try {
    const db = getDb();
    const member = await getSessionMember(db);
    if (!member?.active) return json({ error: "Entre com seu usuário e senha para acessar o sistema." }, 401);
    const params = new URL(request.url).searchParams;
    if (params.get("access")) {
      return json({ access: Object.fromEntries((Object.keys(DATA_SETS) as DataSetKey[]).map((key) => [key, { export: canExport(member, key), import: canImport(member, key) }])) });
    }
    const key = params.get("dataset");
    if (!isDataSet(key)) return json({ error: "Conjunto de dados inválido." }, 400);
    const format = params.get("format") ?? "xlsx";
    const set = DATA_SETS[key];
    const xlsxHeaders = (name: string) => ({ "Cache-Control": "no-store", "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${name}.xlsx"` });
    if (format === "template") {
      if (!canImport(member, key)) return json({ error: "Seu perfil não pode importar estes dados." }, 403);
      const fields = importFields(key);
      const file = buildXlsx([
        { name: set.label, columns: fields.map((field) => ({ header: field.header, width: field.width, type: "text" as const })), rows: [] },
        { name: "Como preencher", columns: [{ header: "Coluna", width: 24 }, { header: "Obrigatória", width: 12 }, { header: "O que colocar", width: 70 }], rows: [...templateGuide(key), ["", "", ""], ["Importante", "", set.match ?? ""]] },
      ]);
      return new Response(file as BodyInit, { headers: xlsxHeaders(`modelo-${set.file}`) });
    }
    if (format !== "xlsx" && format !== "csv") return json({ error: "Formato inválido." }, 400);
    if (!canExport(member, key)) return json({ error: "Seu perfil não pode exportar estes dados." }, 403);
    const look = await lookups(db);
    const table = tableOf(key, await exportRows(db, key, look));
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    await writeAudit(db, { actorUserId: member.userId, actorName: member.name, action: "data_exported", targetType: key, details: `${set.label}: ${table.rows.length} linhas (${format})` }).catch((error) => console.error("audit log failed", error));
    if (format === "csv") return new Response(toCsv(table), { headers: { "Cache-Control": "no-store", "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${set.file}-${today}.csv"` } });
    return new Response(buildXlsx([{ name: set.label, ...table }]) as BodyInit, { headers: xlsxHeaders(`${set.file}-${today}`) });
  } catch (error) {
    console.error("data export failed", error);
    return json({ error: "Não foi possível gerar o arquivo agora." }, 500);
  }
}

/** Só os campos preenchidos (célula vazia não apaga o que já existe). */
const filled = (values: Values) => Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null && value !== undefined));
const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));

async function planRows(db: Db, key: DataSetKey, rows: SheetRow[], allowUpdate: boolean, me: SessionMember, look: Lookups) {
  const fields = importFields(key);
  const plans: Plan[] = [];
  const errors: { line: number; message: string }[] = [];
  const seen = new Set<string>();
  const now = new Date().toISOString();
  const ref = (map: Map<string, number | "ambiguous">, value: unknown, what: string, problems: string[]) => {
    if (!value) return null;
    const id = map.get(foldText(String(value)));
    if (id === "ambiguous") { problems.push(`${what} "${value}" existe mais de uma vez`); return null; }
    if (!id) { problems.push(`${what} "${value}" não encontrado`); return null; }
    return id;
  };
  const person = (value: unknown, problems: string[]) => {
    if (!value) return null;
    const id = look.personId(String(value));
    if (id === "ambiguous") { problems.push(`Há mais de uma pessoa chamada "${value}": use o e-mail`); return null; }
    if (!id) { problems.push(`Pessoa "${value}" não encontrada`); return null; }
    return id;
  };

  // O que já existe, pela chave de cada conjunto.
  const existing = new Map<string, number>();
  const add = (parts: unknown[], id: number) => existing.set(parts.map((part) => foldText(text(part))).join("|"), id);
  const scanOwners = new Map<string, number>();
  if (key === "clients") for (const row of look.clientRows) add([row.name], row.id);
  if (key === "projects") for (const row of look.projectRows) add([row.name], row.id);
  if (key === "people") for (const row of look.people) add([row.email], row.id);
  if (key === "knowledge") for (const row of await db.select({ id: kbArticles.id, title: kbArticles.title }).from(kbArticles)) add([row.title], row.id);
  if (key === "items") for (const row of await db.select({ id: items.id, name: items.name, scanCode: items.scanCode }).from(items)) { add([row.name], row.id); if (row.scanCode) scanOwners.set(row.scanCode, row.id); }
  if (key === "assets") for (const row of await db.select({ id: assets.id, kind: assets.kind, name: assets.name, identifier: assets.identifier }).from(assets)) add([row.kind, row.identifier || row.name], row.id);
  if (key === "absences") for (const row of await db.select({ id: absences.id, memberId: absences.memberId, kind: absences.kind, startDate: absences.startDate }).from(absences)) add([row.memberId, row.kind, row.startDate], row.id);
  if (key === "tickets") for (const row of await db.select({ id: tickets.id, title: tickets.title, client: tickets.client }).from(tickets)) add([row.title, row.client], row.id);
  if (key === "tasks") for (const row of await db.select({ id: tasks.id, title: tasks.title, clientId: tasks.clientId }).from(tasks)) add([row.title, look.client(row.clientId)], row.id);

  for (const row of rows) {
    const problems: string[] = [];
    const cell: Values = {};
    for (const field of fields) {
      const result = readCell(field, row.cells?.[field.key]);
      if (result.error) problems.push(result.error);
      cell[field.key] = result.value;
    }
    let keyParts: unknown[] = [];
    let insert: Values = {};
    let update: Values = {};
    let assigneeId: number | null = null;
    let createOnly = false;

    if (key === "clients") {
      keyParts = [cell.name];
      if (cell.contactEmail && !isRealEmail(String(cell.contactEmail))) problems.push("E-mail inválido");
      update = { contactName: cell.contactName, contactEmail: cell.contactEmail, contactPhone: cell.contactPhone, monthlyHours: cell.monthlyHours, active: cell.active, notes: cell.notes };
      insert = { name: cell.name, ...filled(update) };
    } else if (key === "projects") {
      keyParts = [cell.name];
      update = { clientId: ref(look.clientId, cell.client, "Cliente", problems), farol: cell.farol, phase: cell.phase, deadlineLabel: cell.deadlineLabel, startDate: cell.startDate, endForecast: cell.endForecast, description: cell.description, notes: cell.notes, updatedAt: now };
      insert = { name: cell.name, ...filled(update) };
    } else if (key === "knowledge") {
      keyParts = [cell.title];
      update = { clientId: ref(look.clientId, cell.client, "Cliente", problems), teamId: ref(look.teamId, cell.team, "Time", problems), tags: cell.tags, body: cell.body, updatedByName: me.name, updatedAt: now };
      insert = { title: cell.title, createdById: me.id, createdByName: me.name, ...filled(update) };
    } else if (key === "items") {
      keyParts = [cell.name];
      update = { category: cell.category, unit: cell.unit, minimumQty: cell.minimumQty, scanCode: cell.scanCode, updatedAt: now };
      insert = { name: cell.name, ...filled(update) };
      const owner = cell.scanCode ? scanOwners.get(String(cell.scanCode)) : undefined;
      if (owner && owner !== existing.get(foldText(text(cell.name)))) problems.push("Código de barras já usado em outro item");
    } else if (key === "assets") {
      keyParts = [cell.kind, cell.identifier || cell.name];
      if (cell.seats !== null && (!Number.isInteger(cell.seats) || Number(cell.seats) < 1)) problems.push("Licenças: use um número inteiro a partir de 1");
      update = { name: cell.name, category: cell.category, identifier: cell.identifier, status: cell.status, seats: cell.seats, purchaseDate: cell.purchaseDate, expiresOn: cell.expiresOn, cost: cell.cost, notes: cell.notes, updatedAt: now };
      insert = { kind: cell.kind, ...filled(update) };
    } else if (key === "people") {
      keyParts = [cell.email];
      if (cell.email && !isRealEmail(String(cell.email))) problems.push("E-mail inválido");
      update = { name: cell.name, jobTitle: cell.jobTitle, phone: cell.phone, birthday: cell.birthday, startedOn: cell.startedOn };
      insert = { userId: `import:${crypto.randomUUID()}`, email: String(cell.email ?? "").toLocaleLowerCase("pt-BR"), role: "member", ...filled(update) };
    } else if (key === "absences") {
      const memberId = person(cell.person, problems);
      keyParts = [memberId, cell.kind, cell.startDate];
      if (cell.startDate && cell.endDate && String(cell.endDate) < String(cell.startDate)) problems.push("O fim é antes do início");
      update = { endDate: cell.endDate, note: cell.note };
      insert = { memberId, kind: cell.kind, startDate: cell.startDate, createdById: me.id, createdByName: me.name, status: "approved", decidedByName: me.name, decidedAt: now, ...filled(update) };
    } else if (key === "tickets") {
      createOnly = true;
      keyParts = [cell.title, cell.client];
      assigneeId = person(cell.assignee, problems);
      insert = filled({ title: cell.title, type: cell.type, urgency: cell.urgency, client: cell.client, teamId: ref(look.teamId, cell.team, "Time", problems), assigneeId, description: cell.description, requesterId: me.id, requesterName: me.name, createdAt: now, updatedAt: now });
    } else if (key === "tasks") {
      createOnly = true;
      keyParts = [cell.title, cell.client];
      assigneeId = person(cell.assignee, problems);
      const closed = cell.status === "done";
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
      insert = filled({ title: cell.title, status: cell.status ?? "backlog", priority: cell.priority === null ? null : Number(cell.priority), teamId: ref(look.teamId, cell.team, "Time", problems), clientId: ref(look.clientId, cell.client, "Cliente", problems), projectId: ref(look.projectId, cell.project, "Projeto", problems), assigneeId, category: cell.category, openedOn: cell.openedOn ?? today, startDate: cell.startDate, dueDate: cell.dueDate, estimatedHours: cell.estimatedHours, description: cell.description, origin: "Importação", createdById: me.id, createdByName: me.name, completedOn: closed ? today : null, completedAt: closed ? now : null, createdAt: now, updatedAt: now });
    }

    const rowKey = keyParts.map((part) => foldText(text(part))).join("|");
    if (!problems.length && seen.has(rowKey)) problems.push("Repetida nesta planilha");
    if (problems.length) { errors.push({ line: row.line, message: problems.join("; ") }); continue; }
    seen.add(rowKey);
    const label = text(cell.title ?? cell.name ?? cell.person);
    const id = existing.get(rowKey);
    if (id) plans.push(!createOnly && allowUpdate ? { line: row.line, action: "update", id, update: filled(update), label } : { line: row.line, action: "skip", id, label });
    else plans.push({ line: row.line, action: "create", insert, label, assigneeId });
  }
  return { plans, errors };
}

const TABLES = { clients, projects, knowledge: kbArticles, items, assets, people: members, absences, tickets, tasks } as const;
const chunks = <T,>(list: T[], size: number) => Array.from({ length: Math.ceil(list.length / size) }, (_, index) => list.slice(index * size, (index + 1) * size));

async function commit(db: Db, key: keyof typeof TABLES, plans: Plan[], me: SessionMember) {
  const table = TABLES[key];
  const now = new Date().toISOString();
  const created = plans.filter((plan) => plan.action === "create");
  if (key === "tasks" && created.length) {
    const [row] = await db.select({ value: min(tasks.sortOrder) }).from(tasks);
    const base = row?.value ?? 0;
    created.forEach((plan, index) => { plan.insert = { ...plan.insert, sortOrder: base - index - 1 }; });
  }
  for (const part of chunks(created, 40)) {
    const queries = part.map((plan) => db.insert(table as typeof clients).values(plan.insert as never).returning({ id: (table as typeof clients).id }));
    const results = await db.batch(queries as never) as unknown as { id: number }[][];
    if (key === "tasks" || key === "tickets") {
      const follow: unknown[] = [];
      results.forEach((result, index) => {
        const id = result[0].id;
        if (key === "tasks") {
          follow.push(db.insert(taskEvents).values({ taskId: id, kind: "created", body: "Criada por importação de planilha", actorId: me.id, actorName: me.name, createdAt: now }));
          if (part[index].assigneeId) follow.push(db.insert(taskPeople).values({ taskId: id, memberId: part[index].assigneeId!, role: "owner" }));
        } else follow.push(db.insert(ticketEvents).values({ ticketId: id, kind: "created", body: "Aberto por importação de planilha", actorId: me.id, actorName: me.name, createdAt: now }));
      });
      for (const group of chunks(follow, 40)) await db.batch(group as never);
    }
  }
  const updates = plans.filter((plan) => plan.action === "update" && Object.keys(plan.update ?? {}).length);
  for (const part of chunks(updates, 40)) {
    await db.batch(part.map((plan) => db.update(table as typeof clients).set(plan.update as never).where(eq((table as typeof clients).id, plan.id!))) as never);
  }
}

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) return json({ error: "Origem da solicitação não autorizada." }, 403);
    const db = getDb();
    const member = await getSessionMember(db);
    if (!member?.active) return json({ error: "Entre com seu usuário e senha para acessar o sistema." }, 401);
    const body = await readJsonBody(request, 8 * 1024 * 1024);
    if (body instanceof Response) return body;
    const key = body.dataset;
    if (!isDataSet(key) || !DATA_SETS[key].importable) return json({ error: "Estes dados não podem ser importados." }, 400);
    if (!canImport(member, key)) return json({ error: "Seu perfil não pode importar estes dados." }, 403);
    if (!Array.isArray(body.rows) || !body.rows.length) return json({ error: "A planilha não tem linhas para importar." }, 400);
    if (body.rows.length > MAX_IMPORT_ROWS) return json({ error: `Importe no máximo ${MAX_IMPORT_ROWS} linhas por vez.` }, 400);
    const rows: SheetRow[] = (body.rows as unknown[]).map((row, index) => {
      const source = (row && typeof row === "object" ? row : {}) as { line?: unknown; cells?: unknown };
      const cells = source.cells && typeof source.cells === "object" ? Object.fromEntries(Object.entries(source.cells as Record<string, unknown>).map(([field, value]) => [field, String(value ?? "").slice(0, 25000)])) : {};
      return { line: Number.isInteger(source.line) ? Number(source.line) : index + 2, cells };
    });
    const look = await lookups(db);
    const { plans, errors } = await planRows(db, key, rows, body.update === true, member, look);
    const summary = { create: plans.filter((plan) => plan.action === "create").length, update: plans.filter((plan) => plan.action === "update").length, skip: plans.filter((plan) => plan.action === "skip").length, errors: errors.length };
    if (body.commit !== true) return json({ summary, errors: errors.slice(0, 100), canUpdate: !["tasks", "tickets"].includes(key) });
    // Tudo ou nada na validação: com erro, nada é gravado, para a pessoa corrigir a planilha.
    if (errors.length) return json({ error: "Corrija as linhas com erro antes de importar.", summary, errors: errors.slice(0, 100) }, 400);
    await commit(db, key as keyof typeof TABLES, plans, member);
    await writeAudit(db, { actorUserId: member.userId, actorName: member.name, action: "data_imported", targetType: key, details: `${DATA_SETS[key].label}: ${summary.create} novos, ${summary.update} atualizados, ${summary.skip} ignorados` }).catch((error) => console.error("audit log failed", error));
    return json({ summary, done: true });
  } catch (error) {
    console.error("data import failed", error);
    return json({ error: "Não foi possível importar agora. Nada novo foi confirmado: confira a lista antes de tentar de novo." }, 500);
  }
}
