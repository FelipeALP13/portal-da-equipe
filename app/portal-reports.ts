// Problemas e sugestões do Portal: regras puras (testadas), usadas pela tela e pela rota.

export const reportKinds = ["bug", "idea"] as const;
export type ReportKind = (typeof reportKinds)[number];
export const reportKindLabels: Record<ReportKind, string> = { bug: "Erro", idea: "Sugestão" };

export const reportStatuses = ["open", "doing", "done", "declined"] as const;
export type ReportStatus = (typeof reportStatuses)[number];
export const reportStatusLabels: Record<ReportStatus, string> = { open: "Recebido", doing: "Em correção", done: "Resolvido", declined: "Não será feito" };

export const MAX_REPORT_TITLE = 120;
export const MAX_REPORT_DETAILS = 3000;
export const MAX_OPEN_REPORTS_PER_PERSON = 20;

export const isReportKind = (value: unknown): value is ReportKind => typeof value === "string" && (reportKinds as readonly string[]).includes(value);
export const isReportStatus = (value: unknown): value is ReportStatus => typeof value === "string" && (reportStatuses as readonly string[]).includes(value);
/** Ainda precisa de atenção (aparece em "Abertos"). */
export const isOpenReport = (status: ReportStatus) => status === "open" || status === "doing";

const oneLine = (value: unknown, max: number) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Limpa o que a pessoa escreveu; devolve o erro para mostrar, se faltar o essencial. */
export function cleanReport(input: { kind?: unknown; title?: unknown; details?: unknown; screen?: unknown; device?: unknown }) {
  const title = oneLine(input.title, MAX_REPORT_TITLE);
  const details = String(input.details ?? "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_REPORT_DETAILS);
  const report = {
    kind: isReportKind(input.kind) ? input.kind : "bug" as ReportKind,
    title,
    details,
    screen: oneLine(input.screen, 60),
    device: oneLine(input.device, 200),
  };
  if (title.length < 4) return { report, error: "Diga em poucas palavras o que aconteceu (pelo menos 4 letras)." };
  return { report, error: null };
}

/** Abertos primeiro (os mais antigos no topo, para não ficarem esquecidos); depois os decididos, mais recentes primeiro. */
export function sortReports<T extends { status: ReportStatus; createdAt: string; updatedAt: string }>(rows: readonly T[]) {
  return [...rows].sort((a, b) => {
    const openA = isOpenReport(a.status), openB = isOpenReport(b.status);
    if (openA !== openB) return openA ? -1 : 1;
    return openA ? a.createdAt.localeCompare(b.createdAt) : b.updatedAt.localeCompare(a.updatedAt);
  });
}
