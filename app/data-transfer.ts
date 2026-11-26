// Importar e exportar registros por planilha: quais conjuntos existem, suas colunas e a leitura das células. Regras puras.
import { absenceKindLabels } from "./absences.ts";
import { assetKindLabels, assetStatusLabels } from "./people-tools.ts";
import { projectFarolLabels, projectPhaseLabels } from "./projects.ts";
import { taskPriorityLabels, taskStatusLabels } from "./tasks.ts";
import { ticketTypeLabels, ticketUrgencyLabels } from "./tickets.ts";

export type FieldKind = "text" | "number" | "date" | "choice" | "bool" | "birthday";
export type DataField = {
  key: string;
  header: string;
  kind?: FieldKind;
  required?: boolean;
  max?: number;
  options?: Record<string, string>;
  /** Só sai na exportação; a importação ignora. */
  readOnly?: boolean;
  width?: number;
  hint?: string;
};
export type DataSet = { label: string; file: string; importable: boolean; match?: string; fields: DataField[] };

const priorityOptions = Object.fromEntries(Object.entries(taskPriorityLabels).map(([value, label]) => [String(value), label]));

const SETS = {
  tasks: { label: "Demandas", file: "demandas", importable: true, match: "Linhas com o mesmo título e cliente de uma demanda existente são ignoradas.", fields: [
    { key: "code", header: "Código", readOnly: true, width: 10 },
    { key: "title", header: "Título", required: true, max: 200, width: 40 },
    { key: "status", header: "Status", kind: "choice", options: taskStatusLabels, width: 14 },
    { key: "priority", header: "Prioridade", kind: "choice", options: priorityOptions, width: 12 },
    { key: "team", header: "Time", max: 80, width: 16, hint: "Nome de um time já cadastrado" },
    { key: "client", header: "Cliente", max: 120, width: 20, hint: "Nome de um cliente já cadastrado" },
    { key: "project", header: "Projeto", max: 160, width: 24, hint: "Nome de um projeto já cadastrado" },
    { key: "assignee", header: "Responsável", max: 120, width: 20, hint: "Nome ou e-mail de uma pessoa" },
    { key: "category", header: "Categoria", max: 60, width: 14 },
    { key: "openedOn", header: "Aberta em", kind: "date", width: 12 },
    { key: "startDate", header: "Início", kind: "date", width: 12 },
    { key: "dueDate", header: "Prazo", kind: "date", width: 12 },
    { key: "estimatedHours", header: "Horas estimadas", kind: "number", width: 10 },
    { key: "description", header: "Descrição", max: 5000, width: 50 },
  ] },
  hours: { label: "Horas lançadas", file: "horas", importable: false, fields: [
    { key: "workDate", header: "Dia", kind: "date", width: 12 }, { key: "person", header: "Pessoa", width: 20 }, { key: "hours", header: "Horas", kind: "number", width: 8 },
    { key: "code", header: "Demanda", width: 10 }, { key: "title", header: "Título da demanda", width: 40 }, { key: "client", header: "Cliente", width: 20 },
  ] },
  tickets: { label: "Chamados", file: "chamados", importable: true, match: "Linhas com o mesmo título e cliente de um chamado existente são ignoradas. Entram como abertos.", fields: [
    { key: "code", header: "Código", readOnly: true, width: 10 },
    { key: "title", header: "Título", required: true, max: 200, width: 40 },
    { key: "type", header: "Tipo", kind: "choice", options: ticketTypeLabels, width: 12 },
    { key: "urgency", header: "Urgência", kind: "choice", options: ticketUrgencyLabels, width: 10 },
    { key: "client", header: "Cliente", max: 80, width: 20 },
    { key: "team", header: "Time", required: true, max: 80, width: 16, hint: "Nome de um time já cadastrado" },
    { key: "assignee", header: "Responsável", max: 120, width: 20, hint: "Nome ou e-mail de uma pessoa" },
    { key: "description", header: "Descrição", max: 5000, width: 50 },
    { key: "statusLabel", header: "Situação", readOnly: true, width: 14 },
    { key: "createdOn", header: "Aberto em", kind: "date", readOnly: true, width: 12 },
  ] },
  projects: { label: "Projetos", file: "projetos", importable: true, match: "O nome do projeto identifica o registro.", fields: [
    { key: "name", header: "Projeto", required: true, max: 160, width: 34 },
    { key: "client", header: "Cliente", max: 120, width: 20, hint: "Nome de um cliente já cadastrado" },
    { key: "farol", header: "Farol", kind: "choice", options: projectFarolLabels, width: 10 },
    { key: "phase", header: "Fase", kind: "choice", options: projectPhaseLabels, width: 22 },
    { key: "deadlineLabel", header: "Prazo", max: 80, width: 16 },
    { key: "startDate", header: "Início", kind: "date", width: 12 },
    { key: "endForecast", header: "Previsão de término", max: 80, width: 18 },
    { key: "description", header: "Escopo", max: 5000, width: 50 },
    { key: "notes", header: "Observações", max: 5000, width: 40 },
  ] },
  clients: { label: "Clientes", file: "clientes", importable: true, match: "O nome do cliente identifica o registro.", fields: [
    { key: "name", header: "Cliente", required: true, max: 120, width: 28 },
    { key: "contactName", header: "Contato", max: 120, width: 22 },
    { key: "contactEmail", header: "E-mail", max: 160, width: 28 },
    { key: "contactPhone", header: "Telefone", max: 40, width: 16 },
    { key: "monthlyHours", header: "Horas por mês", kind: "number", width: 10 },
    { key: "active", header: "Ativo", kind: "bool", width: 8 },
    { key: "notes", header: "Observações", max: 5000, width: 40 },
  ] },
  incidents: { label: "Incidentes", file: "incidentes", importable: false, fields: [
    { key: "title", header: "Incidente", width: 36 }, { key: "client", header: "Cliente", width: 20 }, { key: "severity", header: "Gravidade", width: 10 }, { key: "status", header: "Situação", width: 20 },
    { key: "startedOn", header: "Início", kind: "date", width: 12 }, { key: "resolvedOn", header: "Resolvido em", kind: "date", width: 12 },
    { key: "impact", header: "Impacto", width: 36 }, { key: "cause", header: "Causa", width: 36 }, { key: "resolution", header: "Solução", width: 36 }, { key: "prevention", header: "Prevenção", width: 36 },
  ] },
  knowledge: { label: "Base de conhecimento", file: "base-de-conhecimento", importable: true, match: "O título do artigo identifica o registro.", fields: [
    { key: "title", header: "Título", required: true, max: 200, width: 40 },
    { key: "client", header: "Cliente", max: 120, width: 20, hint: "Nome de um cliente já cadastrado" },
    { key: "team", header: "Time", max: 80, width: 16, hint: "Nome de um time já cadastrado" },
    { key: "tags", header: "Etiquetas", max: 200, width: 24 },
    { key: "body", header: "Conteúdo", required: true, max: 20000, width: 70 },
  ] },
  schedule: { label: "Escala de atendimento", file: "escala", importable: false, fields: [
    { key: "startDate", header: "Início", kind: "date", width: 12 }, { key: "endDate", header: "Fim", kind: "date", width: 12 }, { key: "team", header: "Equipe", width: 20 }, { key: "people", header: "Pessoas", width: 40 }, { key: "note", header: "Observação", width: 30 },
  ] },
  people: { label: "Pessoas", file: "pessoas", importable: true, match: "O e-mail identifica a pessoa. Pessoas novas entram sem senha: o acesso é criado em Usuários.", fields: [
    { key: "name", header: "Nome", required: true, max: 120, width: 26 },
    { key: "email", header: "E-mail", required: true, max: 160, width: 30 },
    { key: "jobTitle", header: "Cargo", max: 80, width: 22 },
    { key: "phone", header: "Telefone", max: 40, width: 16 },
    { key: "birthday", header: "Aniversário", kind: "birthday", width: 11, hint: "Dia e mês, ex.: 25/03" },
    { key: "startedOn", header: "Entrada na empresa", kind: "date", width: 14 },
    { key: "roleLabel", header: "Perfil", readOnly: true, width: 16 },
    { key: "activeLabel", header: "Acesso", readOnly: true, width: 10 },
  ] },
  absences: { label: "Férias e ausências", file: "ausencias", importable: true, match: "Mesma pessoa, tipo e início identificam a ausência.", fields: [
    { key: "person", header: "Pessoa", required: true, max: 160, width: 26, hint: "Nome ou e-mail de uma pessoa" },
    { key: "kind", header: "Tipo", kind: "choice", required: true, options: absenceKindLabels, width: 16 },
    { key: "startDate", header: "Início", kind: "date", required: true, width: 12 },
    { key: "endDate", header: "Fim", kind: "date", required: true, width: 12 },
    { key: "note", header: "Observação", max: 300, width: 34 },
    { key: "statusLabel", header: "Situação", readOnly: true, width: 12 },
  ] },
  assets: { label: "Equipamentos e licenças", file: "equipamentos", importable: true, match: "Tipo e patrimônio (ou o nome, sem patrimônio) identificam o registro.", fields: [
    { key: "kind", header: "Tipo", kind: "choice", required: true, options: assetKindLabels, width: 14 },
    { key: "name", header: "Nome", required: true, max: 120, width: 28 },
    { key: "category", header: "Categoria", max: 60, width: 16 },
    { key: "identifier", header: "Patrimônio / chave", max: 120, width: 20 },
    { key: "status", header: "Situação", kind: "choice", options: assetStatusLabels, width: 14 },
    { key: "seats", header: "Licenças", kind: "number", width: 9 },
    { key: "purchaseDate", header: "Compra", kind: "date", width: 12 },
    { key: "expiresOn", header: "Vencimento", kind: "date", width: 12 },
    { key: "cost", header: "Custo", kind: "number", width: 10 },
    { key: "notes", header: "Observações", max: 2000, width: 36 },
  ] },
  maintenance: { label: "Manutenção", file: "manutencao", importable: false, fields: [
    { key: "code", header: "Pedido", kind: "number", width: 8 }, { key: "title", header: "O que aconteceu", width: 36 }, { key: "location", header: "Onde", width: 18 }, { key: "priority", header: "Urgência", width: 12 },
    { key: "status", header: "Situação", width: 18 }, { key: "requester", header: "Pedido por", width: 20 }, { key: "assignee", header: "Responsável", width: 20 }, { key: "createdOn", header: "Aberto em", kind: "date", width: 12 }, { key: "resolvedOn", header: "Resolvido em", kind: "date", width: 12 },
  ] },
  items: { label: "Itens do estoque", file: "estoque", importable: true, match: "O time e o nome identificam o item (cada time tem o próprio estoque). Saldos não mudam pela planilha: use compra ou ajuste.", fields: [
    { key: "name", header: "Item", required: true, max: 80, width: 28 },
    { key: "team", header: "Time", max: 80, width: 16, hint: "Time dono do estoque. Em branco: o seu time (se você for de um só)." },
    { key: "category", header: "Categoria", max: 40, width: 16 },
    { key: "unit", header: "Unidade", max: 16, width: 9 },
    { key: "minimumQty", header: "Mínimo", kind: "number", width: 8 },
    { key: "scanCode", header: "Código de barras", max: 64, width: 18 },
    { key: "unopenedQty", header: "Fechado", kind: "number", readOnly: true, width: 8 },
    { key: "openedQty", header: "Aberto", kind: "number", readOnly: true, width: 8 },
  ] },
  movements: { label: "Histórico do estoque", file: "historico-estoque", importable: false, fields: [
    { key: "day", header: "Dia", kind: "date", width: 12 }, { key: "team", header: "Time", width: 16 }, { key: "item", header: "Item", width: 28 }, { key: "type", header: "Movimento", width: 14 }, { key: "quantity", header: "Quantidade", kind: "number", width: 10 }, { key: "person", header: "Quem", width: 20 }, { key: "note", header: "Observação", width: 34 },
  ] },
} satisfies Record<string, DataSet>;

export const DATA_SETS: Record<keyof typeof SETS, DataSet> = SETS;

export type DataSetKey = keyof typeof SETS;
export const isDataSet = (value: unknown): value is DataSetKey => typeof value === "string" && Object.prototype.hasOwnProperty.call(DATA_SETS, value);
export const dataFields = (key: DataSetKey): DataField[] => DATA_SETS[key].fields;
export const importFields = (key: DataSetKey) => dataFields(key).filter((field) => !field.readOnly);

/** Quais conjuntos aparecem em cada tela do Portal. */
export const SCREEN_DATA: Record<string, DataSetKey[]> = {
  tasks: ["tasks", "hours"], tickets: ["tickets"], projects: ["projects"], clients: ["clients", "incidents"], knowledge: ["knowledge"], schedule: ["schedule"],
  people: ["people", "absences", "assets"], team: ["people"], maintenance: ["maintenance"], stock: ["items"], history: ["movements"],
  admin: ["tasks", "tickets", "projects", "clients", "knowledge", "people", "absences", "assets", "items", "hours", "incidents", "schedule", "maintenance", "movements"],
};

export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export const foldText = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();

/** Tira o apóstrofo que a exportação põe para o Excel não rodar fórmulas. */
const cleanText = (value: string) => value.replace(/^'(?=[=+\-@])/, "").replace(/\u0000/g, "").trim();

/** AAAA-MM-DD a partir de data ISO ou brasileira; null se não for uma data real. */
export function parseDay(value: string) {
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const br = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  const [year, month, day] = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : br ? [Number(br[3].length === 2 ? `20${br[3]}` : br[3]), Number(br[2]), Number(br[1])] : [0, 0, 0];
  if (!year) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Número em formato brasileiro ou internacional ("1.234,5", "12.5", "R$ 30"). */
export function parseNumber(value: string) {
  let text = value.replace(/[R$\s]/g, "");
  if (!text) return null;
  if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function parseBirthday(value: string) {
  const short = value.trim().match(/^(\d{1,2})[/-](\d{1,2})$/);
  const day = short ? parseDay(`${short[1]}/${short[2]}/2000`) : parseDay(value);
  return day ? day.slice(5) : null;
}

export type CellResult = { value: string | number | boolean | null; error?: string };

/** Lê uma célula conforme o tipo da coluna. Vazio vira null (e não apaga o que já existe). */
export function readCell(field: DataField, raw: unknown): CellResult {
  const text = cleanText(String(raw ?? ""));
  if (!text) return field.required ? { value: null, error: `${field.header} é obrigatório` } : { value: null };
  const kind = field.kind ?? "text";
  if (kind === "number") {
    const number = parseNumber(text);
    return number === null || number < 0 ? { value: null, error: `${field.header}: número inválido ("${text.slice(0, 20)}")` } : { value: number };
  }
  if (kind === "date") {
    const day = parseDay(text);
    return day ? { value: day } : { value: null, error: `${field.header}: data inválida ("${text.slice(0, 20)}")` };
  }
  if (kind === "birthday") {
    const day = parseBirthday(text);
    return day ? { value: day } : { value: null, error: `${field.header}: use dia e mês, ex.: 25/03` };
  }
  if (kind === "bool") {
    const fold = foldText(text);
    if (["sim", "s", "ativo", "true", "verdadeiro", "1"].includes(fold)) return { value: true };
    if (["nao", "n", "inativo", "false", "falso", "0"].includes(fold)) return { value: false };
    return { value: null, error: `${field.header}: use Sim ou Não` };
  }
  if (kind === "choice") {
    const fold = foldText(text);
    const found = Object.entries(field.options ?? {}).find(([value, label]) => foldText(label) === fold || foldText(value) === fold);
    return found ? { value: found[0] } : { value: null, error: `${field.header}: "${text.slice(0, 24)}" não existe. Use: ${Object.values(field.options ?? {}).join(", ")}` };
  }
  if (field.max && text.length > field.max) return { value: null, error: `${field.header}: passa de ${field.max} caracteres` };
  return { value: text };
}

export type SheetRow = { line: number; cells: Record<string, string> };

/** Acha a linha de títulos (até a 10ª) e transforma a planilha em linhas com as chaves das colunas. */
export function mapSheet(key: DataSetKey, sheet: string[][]): { rows: SheetRow[]; missing: string[]; found: string[] } {
  const fields = importFields(key);
  const byHeader = new Map(fields.map((field) => [foldText(field.header), field]));
  let headerLine = -1;
  let best = 0;
  sheet.slice(0, 10).forEach((row, index) => {
    const hits = (row ?? []).filter((cell) => byHeader.has(foldText(String(cell ?? "")))).length;
    if (hits > best) { best = hits; headerLine = index; }
  });
  const required = fields.filter((field) => field.required).map((field) => field.header);
  if (headerLine < 0) return { rows: [], missing: required.length ? required : fields.map((field) => field.header), found: [] };
  const columns = (sheet[headerLine] ?? []).map((cell) => byHeader.get(foldText(String(cell ?? ""))) ?? null);
  const present = new Set(columns.filter(Boolean).map((field) => field!.key));
  const rows: SheetRow[] = [];
  for (let index = headerLine + 1; index < sheet.length; index += 1) {
    const row = sheet[index] ?? [];
    if (!row.some((cell) => String(cell ?? "").trim())) continue;
    const cells: Record<string, string> = {};
    columns.forEach((field, column) => { if (field) cells[field.key] = String(row[column] ?? ""); });
    rows.push({ line: index + 1, cells });
  }
  return { rows, missing: fields.filter((field) => field.required && !present.has(field.key)).map((field) => field.header), found: fields.filter((field) => present.has(field.key)).map((field) => field.header) };
}

/** CSV do Excel brasileiro (ponto e vírgula) ou internacional (vírgula), com aspas e quebras de linha. */
export function parseCsv(input: string) {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const separator = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && !cell) quoted = true;
    else if (char === separator) { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/** Aba "Como preencher" do modelo. */
export function templateGuide(key: DataSetKey) {
  return importFields(key).map((field) => [
    field.header,
    field.required ? "Sim" : "Não",
    field.options ? Object.values(field.options).join(", ") : field.hint ?? (field.kind === "date" ? "Data, ex.: 25/03/2026" : field.kind === "number" ? "Número" : field.kind === "bool" ? "Sim ou Não" : "Texto"),
  ]);
}
