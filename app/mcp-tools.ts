// Ferramentas do MCP: o que uma IA conectada pode consultar e fazer no Portal.
// Cada ferramenta chama a MESMA rota que as telas usam, como a pessoa dona da chave
// (actingMember): valem as permissões, as regras, os avisos e o registro de auditoria de sempre.
import { actingMember, type SessionMember } from "./auth-session";
import * as tasksRoute from "./api/tasks/route";
import * as ticketsRoute from "./api/tickets/route";
import * as agendaRoute from "./api/agenda/route";
import * as notificationsRoute from "./api/notifications/route";
import * as inventoryRoute from "./api/inventory/route";
import * as searchRoute from "./api/search/route";
import * as reportsRoute from "./api/portal-reports/route";
import { taskStatusLabels, taskStatuses, taskPriorityLabels, type TaskPriority } from "./tasks";
import { ticketStatusLabels, ticketStatuses, ticketTypes, ticketUrgencies } from "./tickets";

type Handler = (request: Request) => Promise<Response> | Response;
type Route = { GET?: Handler; POST?: Handler };
const routes: Record<string, Route> = {
  "/api/tasks": tasksRoute as Route, "/api/tickets": ticketsRoute as Route, "/api/agenda": agendaRoute as Route,
  "/api/notifications": notificationsRoute as Route, "/api/inventory": inventoryRoute as Route,
  "/api/search": searchRoute as Route, "/api/portal-reports": reportsRoute as Route,
};

export type ToolContext = { member: SessionMember; origin: string; areas: Set<string> };
type Json = Record<string, unknown>;

/** Chama uma rota do Portal como a pessoa dona da chave. Erro da rota vira erro da ferramenta (com a mesma mensagem). */
async function call<T = Json>(ctx: ToolContext, path: string, method: "GET" | "POST", payload?: Json, query = ""): Promise<T> {
  const handler = routes[path]?.[method];
  if (!handler) throw new Error("Rota indisponível.");
  const request = new Request(ctx.origin + path + query, {
    method,
    headers: { origin: ctx.origin, "content-type": "application/json", accept: "application/json" },
    body: method === "POST" ? JSON.stringify(payload ?? {}) : undefined,
  });
  const response = await actingMember.run(ctx.member, () => handler(request));
  const data = await response.json().catch(() => ({})) as Json;
  if (!response.ok) throw new Error(String(data.error ?? `O Portal recusou (código ${response.status}).`));
  // Alteração: a tela de quem está com o Portal aberto atualiza (mesma área da rota).
  if (method === "POST") ctx.areas.add(path.split("/")[2]);
  return data as T;
}

const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR").trim();
const str = (value: unknown, max = 2000) => String(value ?? "").trim().slice(0, max);
const day = (value: unknown) => { const text = str(value, 10); return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null; };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

/** Acha uma pessoa (ou time, item...) pelo nome: igual, depois "começa com", depois "contém". Ambíguo = erro claro. */
function byName<T extends { id: number; name: string }>(list: readonly T[], name: unknown, what: string): T {
  const wanted = fold(str(name, 120));
  if (!wanted) throw new Error(`Informe o nome d${what === "pessoa" ? "a" : "o"} ${what}.`);
  for (const match of [(x: T) => fold(x.name) === wanted, (x: T) => fold(x.name).startsWith(wanted), (x: T) => fold(x.name).includes(wanted)]) {
    const found = list.filter(match);
    if (found.length === 1) return found[0];
    if (found.length > 1) throw new Error(`Há mais de um(a) ${what} com "${name}": ${found.slice(0, 6).map((x) => x.name).join(", ")}. Seja mais específico.`);
  }
  throw new Error(`Não encontrei ${what} "${name}".`);
}

const priorityByWord: Record<string, TaskPriority> = { critica: 1, alta: 2, media: 3, baixa: 4, sem: 0, nenhuma: 0 };
const taskStatusEnum = [...taskStatuses];

type Task = { id: number; title: string; description: string; status: string; priority: TaskPriority; dueDate: string | null; owners: number[]; support: number[]; clientId: number | null; teamId: number | null; category: string; commentCount: number; updatedAt: string };
type TasksData = { tasks: Task[]; members: { id: number; name: string }[]; clients?: { id: number; name: string }[]; teams?: { id: number; name: string }[]; me: { id: number } };

function taskSummary(task: Task, data: TasksData) {
  const name = (id: number) => data.members.find((person) => person.id === id)?.name ?? `#${id}`;
  return {
    codigo: `DEM-${task.id}`, id: task.id, titulo: task.title,
    status: taskStatusLabels[task.status as keyof typeof taskStatusLabels] ?? task.status,
    prioridade: taskPriorityLabels[task.priority] ?? "",
    prazo: task.dueDate, responsaveis: task.owners.map(name), apoio: task.support.map(name),
    cliente: data.clients?.find((client) => client.id === task.clientId)?.name ?? null,
    categoria: task.category || null, comentarios: task.commentCount,
  };
}

export type Tool = { name: string; description: string; inputSchema: Json; run: (args: Json, ctx: ToolContext) => Promise<unknown> };

export const tools: Tool[] = [
  {
    name: "quem_sou_eu",
    description: "Mostra quem está conectado (a pessoa dona da chave) e o perfil de acesso. As ações da IA valem como dessa pessoa.",
    inputSchema: { type: "object", properties: {} },
    run: async (_args, ctx) => ({ nome: ctx.member.name, usuario: ctx.member.username, perfil: { admin: "Administrador", member: "Membro", viewer: "Somente leitura" }[ctx.member.role], hoje: today() }),
  },
  {
    name: "buscar",
    description: "Busca no Portal (demandas, chamados, pessoas, clientes, artigos da base de conhecimento...). Use para achar códigos e nomes antes de agir.",
    inputSchema: { type: "object", properties: { texto: { type: "string", description: "O que procurar (2+ letras)." } }, required: ["texto"] },
    run: async (args, ctx) => (await call<{ results: unknown[] }>(ctx, "/api/search", "GET", undefined, `?q=${encodeURIComponent(str(args.texto, 80))}`)).results,
  },
  {
    name: "listar_demandas",
    description: "Lista demandas. Por padrão, as abertas em que a pessoa é responsável ou apoio.",
    inputSchema: { type: "object", properties: {
      escopo: { type: "string", enum: ["minhas", "todas"], description: "minhas (padrão) ou todas." },
      status: { type: "string", enum: [...taskStatusEnum, "abertas"], description: "Filtra por status. 'abertas' (padrão) = tudo menos concluído e cancelado." },
      texto: { type: "string", description: "Filtra pelo título." },
      vencidas: { type: "boolean", description: "Só as com prazo vencido." },
      limite: { type: "number", description: "Máximo de resultados (padrão 30, até 100)." },
    } },
    run: async (args, ctx) => {
      const data = await call<TasksData>(ctx, "/api/tasks", "GET");
      const status = str(args.status) || "abertas";
      const text = fold(str(args.texto, 80));
      const now = today();
      const list = data.tasks.filter((task) =>
        (args.escopo === "todas" || task.owners.includes(data.me.id) || task.support.includes(data.me.id))
        && (status === "abertas" ? !["done", "canceled"].includes(task.status) : task.status === status)
        && (!text || fold(task.title).includes(text))
        && (!args.vencidas || Boolean(task.dueDate && task.dueDate < now && !["done", "canceled"].includes(task.status))));
      const limit = Math.min(100, Math.max(1, Number(args.limite) || 30));
      return { total: list.length, demandas: list.slice(0, limit).map((task) => taskSummary(task, data)) };
    },
  },
  {
    name: "ver_demanda",
    description: "Detalhes de uma demanda: descrição, checklist e comentários recentes.",
    inputSchema: { type: "object", properties: { id: { type: "number", description: "Número da demanda (DEM-123 → 123)." } }, required: ["id"] },
    run: async (args, ctx) => {
      const id = Number(String(args.id).replace(/\D/g, ""));
      const data = await call<TasksData>(ctx, "/api/tasks", "GET");
      const task = data.tasks.find((entry) => entry.id === id);
      if (!task) throw new Error(`Demanda DEM-${id} não encontrada.`);
      const detail = await call<{ events: { kind: string; body: string; actorName: string; createdAt: string }[]; checklist: { text: string; done: boolean }[] }>(ctx, "/api/tasks", "GET", undefined, `?taskId=${id}`);
      return {
        ...taskSummary(task, data), descricao: task.description,
        checklist: (detail.checklist ?? []).map((item) => `${item.done ? "[x]" : "[ ]"} ${item.text}`),
        comentarios_recentes: (detail.events ?? []).filter((event) => event.kind === "comment").slice(-10).map((event) => ({ de: event.actorName, quando: event.createdAt, texto: event.body })),
      };
    },
  },
  {
    name: "criar_demanda",
    description: "Cria uma demanda. Sem responsáveis, fica com a própria pessoa. Prazo é opcional (demanda sem urgência pode ficar sem prazo).",
    inputSchema: { type: "object", properties: {
      titulo: { type: "string" }, descricao: { type: "string" },
      status: { type: "string", enum: taskStatusEnum, description: "Padrão: todo (A Fazer)." },
      prioridade: { type: "string", enum: ["critica", "alta", "media", "baixa", "sem"] },
      prazo: { type: "string", description: "AAAA-MM-DD (opcional)." },
      responsaveis: { type: "array", items: { type: "string" }, description: "Nomes das pessoas (opcional)." },
      cliente: { type: "string", description: "Nome do cliente (opcional)." },
    }, required: ["titulo"] },
    run: async (args, ctx) => {
      const data = await call<TasksData>(ctx, "/api/tasks", "GET");
      const owners = Array.isArray(args.responsaveis) && args.responsaveis.length ? args.responsaveis.map((name) => byName(data.members, name, "pessoa").id) : [data.me.id];
      const clientId = args.cliente ? byName(data.clients ?? [], args.cliente, "cliente").id : null;
      const result = await call<{ task: Task }>(ctx, "/api/tasks", "POST", {
        action: "createTask", title: str(args.titulo, 200), description: str(args.descricao, 5000), status: str(args.status) || "todo",
        priority: priorityByWord[fold(str(args.prioridade))] ?? 0, dueDate: day(args.prazo), owners, clientId,
      });
      return { criada: `DEM-${result.task.id}`, id: result.task.id, titulo: result.task.title };
    },
  },
  {
    name: "atualizar_demanda",
    description: "Muda status, prioridade, prazo ou título de uma demanda. Pausar apaga o prazo (regra do Portal).",
    inputSchema: { type: "object", properties: {
      id: { type: "number" }, status: { type: "string", enum: taskStatusEnum },
      prioridade: { type: "string", enum: ["critica", "alta", "media", "baixa", "sem"] },
      prazo: { type: "string", description: "AAAA-MM-DD, ou 'sem' para tirar o prazo." }, titulo: { type: "string" },
    }, required: ["id"] },
    run: async (args, ctx) => {
      const changes: Json = { action: "updateTask", taskId: Number(String(args.id).replace(/\D/g, "")) };
      if (args.status) changes.status = str(args.status);
      if (args.prioridade) changes.priority = priorityByWord[fold(str(args.prioridade))] ?? 0;
      if (args.prazo) changes.dueDate = fold(str(args.prazo)) === "sem" ? null : day(args.prazo);
      if (args.titulo) changes.title = str(args.titulo, 200);
      if (Object.keys(changes).length <= 2) throw new Error("Diga o que mudar: status, prioridade, prazo ou título.");
      const result = await call<{ task: Task }>(ctx, "/api/tasks", "POST", changes);
      return { atualizada: `DEM-${result.task.id}`, status: taskStatusLabels[result.task.status as keyof typeof taskStatusLabels], prazo: result.task.dueDate, prioridade: taskPriorityLabels[result.task.priority] };
    },
  },
  {
    name: "comentar_demanda",
    description: "Escreve um comentário numa demanda (quem acompanha recebe aviso). Use @Nome para mencionar.",
    inputSchema: { type: "object", properties: { id: { type: "number" }, texto: { type: "string" } }, required: ["id", "texto"] },
    run: async (args, ctx) => { await call(ctx, "/api/tasks", "POST", { action: "addComment", taskId: Number(String(args.id).replace(/\D/g, "")), body: str(args.texto, 4000) }); return { ok: true }; },
  },
  {
    name: "listar_chamados",
    description: "Lista chamados internos. Por padrão, os abertos que a pessoa abriu ou atende.",
    inputSchema: { type: "object", properties: {
      escopo: { type: "string", enum: ["meus", "todos"] }, status: { type: "string", enum: [...ticketStatuses, "abertos"] }, limite: { type: "number" },
    } },
    run: async (args, ctx) => {
      const data = await call<{ tickets: { id: number; title: string; status: string; urgency: string; type: string; client: string; teamId: number | null; requesterId: number | null; requesterName: string; assigneeId: number | null; createdAt: string; commentCount: number }[]; members: { id: number; name: string }[]; teams: { id: number; name: string }[] }>(ctx, "/api/tickets", "GET");
      const status = str(args.status) || "abertos";
      const list = data.tickets.filter((ticket) => (args.escopo === "todos" || ticket.requesterId === ctx.member.id || ticket.assigneeId === ctx.member.id)
        && (status === "abertos" ? !["resolved", "canceled"].includes(ticket.status) : ticket.status === status));
      const limit = Math.min(100, Math.max(1, Number(args.limite) || 30));
      return { total: list.length, chamados: list.slice(0, limit).map((ticket) => ({
        codigo: `SUP-${ticket.id}`, id: ticket.id, titulo: ticket.title, status: ticketStatusLabels[ticket.status as keyof typeof ticketStatusLabels] ?? ticket.status,
        urgencia: ticket.urgency, tipo: ticket.type, cliente: ticket.client || null, time: data.teams.find((team) => team.id === ticket.teamId)?.name ?? null,
        aberto_por: ticket.requesterName, atendente: data.members.find((person) => person.id === ticket.assigneeId)?.name ?? null, aberto_em: ticket.createdAt, comentarios: ticket.commentCount,
      })) };
    },
  },
  {
    name: "abrir_chamado",
    description: "Abre um chamado interno para um time (ex.: Suporte, Desenvolvimento).",
    inputSchema: { type: "object", properties: {
      titulo: { type: "string" }, time: { type: "string", description: "Nome do time que recebe." }, descricao: { type: "string" },
      tipo: { type: "string", enum: [...ticketTypes] }, urgencia: { type: "string", enum: [...ticketUrgencies] }, cliente: { type: "string" },
    }, required: ["titulo", "time"] },
    run: async (args, ctx) => {
      const data = await call<{ teams: { id: number; name: string }[] }>(ctx, "/api/tickets", "GET");
      const team = byName(data.teams, args.time, "time");
      const result = await call<{ ticket: { id: number; title: string } }>(ctx, "/api/tickets", "POST", {
        action: "createTicket", title: str(args.titulo, 200), description: str(args.descricao, 5000), teamId: team.id,
        type: str(args.tipo) || "question", urgency: str(args.urgencia) || "normal", client: str(args.cliente, 80),
      });
      return { aberto: `SUP-${result.ticket.id}`, id: result.ticket.id, time: team.name };
    },
  },
  {
    name: "comentar_chamado",
    description: "Escreve um comentário num chamado.",
    inputSchema: { type: "object", properties: { id: { type: "number" }, texto: { type: "string" } }, required: ["id", "texto"] },
    run: async (args, ctx) => { await call(ctx, "/api/tickets", "POST", { action: "addComment", ticketId: Number(String(args.id).replace(/\D/g, "")), body: str(args.texto, 4000) }); return { ok: true }; },
  },
  {
    name: "atualizar_chamado",
    description: "Muda o status de um chamado (quem atende ou quem abriu, conforme as regras do Portal).",
    inputSchema: { type: "object", properties: { id: { type: "number" }, status: { type: "string", enum: [...ticketStatuses] } }, required: ["id", "status"] },
    run: async (args, ctx) => { await call(ctx, "/api/tickets", "POST", { action: "updateTicket", ticketId: Number(String(args.id).replace(/\D/g, "")), status: str(args.status) }); return { ok: true, status: ticketStatusLabels[str(args.status) as keyof typeof ticketStatusLabels] }; },
  },
  {
    name: "minha_agenda",
    description: "Compromissos da pessoa nas próximas 24 horas.",
    inputSchema: { type: "object", properties: {} },
    run: async (_args, ctx) => (await call<{ events: unknown[] }>(ctx, "/api/agenda", "GET", undefined, "?upcoming=1")).events,
  },
  {
    name: "criar_compromisso",
    description: "Anota um compromisso ou reunião na agenda da pessoa.",
    inputSchema: { type: "object", properties: {
      titulo: { type: "string" }, dia: { type: "string", description: "AAAA-MM-DD" }, hora: { type: "string", description: "HH:MM" },
      fim: { type: "string", description: "HH:MM (opcional)" }, tipo: { type: "string", enum: ["anotacao", "reuniao"] }, observacoes: { type: "string" },
      avisar_minutos_antes: { type: "number", description: "Ex.: 10, 30, 60 (opcional)." },
    }, required: ["titulo", "dia", "hora"] },
    run: async (args, ctx) => {
      await call(ctx, "/api/agenda", "POST", {
        action: "saveEvent", kind: args.tipo === "reuniao" ? "meeting" : "note", title: str(args.titulo, 140), notes: str(args.observacoes, 2000),
        day: str(args.dia, 10), time: str(args.hora, 5), endTime: str(args.fim, 5), remindBefore: args.avisar_minutos_antes == null ? null : Number(args.avisar_minutos_antes),
        teamsUrl: "", attendees: [], repeat: "", repeatUntil: "",
      });
      return { ok: true };
    },
  },
  {
    name: "meus_avisos",
    description: "Avisos do sino da pessoa (os mais recentes) e prazos de demandas próximos.",
    inputSchema: { type: "object", properties: { so_nao_lidos: { type: "boolean" } } },
    run: async (args, ctx) => {
      const data = await call<{ items: { body: string; actorName: string; readAt: string | null; createdAt: string; taskTitle: string | null; ticketTitle: string | null }[]; unread: number; due: unknown[] }>(ctx, "/api/notifications", "GET");
      return { nao_lidos: data.unread, prazos: data.due, avisos: data.items.filter((item) => !args.so_nao_lidos || !item.readAt).map((item) => ({ de: item.actorName, texto: item.body, demanda: item.taskTitle, chamado: item.ticketTitle, lido: Boolean(item.readAt), quando: item.createdAt })) };
    },
  },
  {
    name: "ver_estoque",
    description: "Itens do estoque da Copa do time da pessoa, com saldo e o que está abaixo do mínimo.",
    inputSchema: { type: "object", properties: {} },
    run: async (_args, ctx) => {
      const data = await call<{ items: { name: string; unit: string; unopenedQty: number; openedQty: number; minimumQty: number }[]; stockTeams?: { id: number; name: string }[]; stockTeamId?: number | null }>(ctx, "/api/inventory", "GET");
      return {
        time: data.stockTeams?.find((team) => team.id === data.stockTeamId)?.name ?? null,
        itens: data.items.map((item) => ({ item: item.name, fechado: item.unopenedQty, aberto: item.openedQty, minimo: item.minimumQty, unidade: item.unit, precisa_comprar: item.unopenedQty + item.openedQty <= item.minimumQty })),
      };
    },
  },
  {
    name: "registrar_no_estoque",
    description: "Registra compra, abertura ou consumo de um item do estoque da Copa do time da pessoa.",
    inputSchema: { type: "object", properties: {
      item: { type: "string", description: "Nome do item." }, tipo: { type: "string", enum: ["compra", "abertura", "consumo"] }, quantidade: { type: "number" },
    }, required: ["item", "tipo", "quantidade"] },
    run: async (args, ctx) => {
      const data = await call<{ items: { id: number; name: string }[] }>(ctx, "/api/inventory", "GET");
      const item = byName(data.items, args.item, "item");
      const type = { compra: "purchase", abertura: "open", consumo: "consume" }[str(args.tipo)] ?? "";
      if (!type) throw new Error("Tipo deve ser compra, abertura ou consumo.");
      await call(ctx, "/api/inventory", "POST", { action: "movement", itemId: item.id, type, quantity: Number(args.quantidade), note: "Registrado pela IA" });
      return { ok: true, item: item.name };
    },
  },
  {
    name: "reportar_problema",
    description: "Relata um erro ou sugestão sobre o próprio Portal (vai para os administradores).",
    inputSchema: { type: "object", properties: { tipo: { type: "string", enum: ["erro", "sugestao"] }, titulo: { type: "string" }, detalhes: { type: "string" } }, required: ["titulo"] },
    run: async (args, ctx) => { await call(ctx, "/api/portal-reports", "POST", { action: "create", kind: args.tipo === "sugestao" ? "idea" : "bug", title: str(args.titulo, 120), details: str(args.detalhes, 3000), screen: "IA (MCP)" }); return { ok: true }; },
  },
];
