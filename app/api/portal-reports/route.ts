// Problemas e sugestões do Portal: qualquer pessoa relata e acompanha os seus; administradores veem todos,
// mudam a situação e respondem (quem relatou recebe aviso no sino).
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { members, notifications, portalReports } from "../../../db/schema";
import { getSessionMember, type SessionMember } from "../../auth-session";
import { writeAudit } from "../../audit";
import { hasTrustedOrigin } from "../../request-security";
import { readJsonBody } from "../../api-input";
import { cleanReport, isOpenReport, isReportStatus, MAX_OPEN_REPORTS_PER_PERSON, reportStatusLabels, sortReports } from "../../portal-reports";

type Db = ReturnType<typeof getDb>;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Só o formato de imagem que a rota de envio cria para o chat (media/chat/<uuid>.<ext>). */
function imageKeyFrom(value: unknown) {
  const key = String(value ?? "");
  return /^media\/chat\/[0-9a-f-]{36}\.(png|jpg|gif|webp)$/.test(key) ? key : null;
}

const isAdmin = (member: SessionMember) => member.role === "admin";

async function notify(db: Db, memberIds: readonly number[], actorName: string, body: string) {
  const ids = [...new Set(memberIds)];
  if (!ids.length) return;
  const now = new Date().toISOString();
  try {
    for (let index = 0; index < ids.length; index += 20) await db.insert(notifications).values(ids.slice(index, index + 20).map((memberId) => ({ memberId, kind: "portal_report" as const, actorName, body: body.slice(0, 140), createdAt: now })));
  } catch (error) {
    console.error("portal report notification failed", error);
  }
}

export async function GET() {
  try {
    const db = getDb();
    const member = await getSessionMember(db);
    if (!member?.active) return json({ error: "Entre com seu usuário e senha para acessar o sistema." }, 401);
    const admin = isAdmin(member);
    const rows = await db.select().from(portalReports).where(admin ? undefined : eq(portalReports.createdById, member.id)).orderBy(desc(portalReports.createdAt)).limit(300);
    const reports = sortReports(rows).map((row) => ({
      id: row.id, kind: row.kind, title: row.title, details: row.details, screen: row.screen,
      device: admin ? row.device : "", status: row.status, response: row.response,
      imageUrl: row.imageKey ? `/api/media?key=${encodeURIComponent(row.imageKey)}` : null,
      createdByName: row.createdByName, mine: row.createdById === member.id, updatedByName: row.updatedByName,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
      canDelete: row.status === "open" && (admin || row.createdById === member.id),
    }));
    return json({ reports, canManage: admin });
  } catch (error) {
    console.error("portal reports load failed", error);
    const message = error instanceof Error ? error.message : "";
    return json({ error: message.includes("no such table") ? "O banco ainda não tem os relatos de problema. Publique de novo para aplicar a migração." : "Não foi possível carregar os relatos agora." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) return json({ error: "Origem da solicitação não autorizada." }, 403);
    const db = getDb();
    const member = await getSessionMember(db);
    if (!member?.active) return json({ error: "Entre com seu usuário e senha para acessar o sistema." }, 401);
    const body = await readJsonBody(request);
    if (body instanceof Response) return body;
    const action = String(body.action ?? "");
    const now = new Date().toISOString();

    if (action === "create") {
      const { report, error } = cleanReport(body);
      if (error) return json({ error }, 400);
      const open = await db.select({ id: portalReports.id }).from(portalReports).where(and(eq(portalReports.createdById, member.id), inArray(portalReports.status, ["open", "doing"])));
      if (open.length >= MAX_OPEN_REPORTS_PER_PERSON) return json({ error: `Você já tem ${MAX_OPEN_REPORTS_PER_PERSON} relatos abertos. Espere alguns serem resolvidos.` }, 429);
      const [created] = await db.insert(portalReports).values({ ...report, imageKey: imageKeyFrom(body.imageKey), createdById: member.id, createdByName: member.name, createdAt: now, updatedAt: now }).returning();
      const admins = (await db.select({ id: members.id }).from(members).where(and(eq(members.role, "admin"), eq(members.active, true)))).map((row) => row.id).filter((id) => id !== member.id);
      await notify(db, admins, member.name, `${report.kind === "idea" ? "Sugestão" : "Problema"} no Portal: ${report.title}`);
      await writeAudit(db, { actorUserId: member.userId, actorName: member.name, action: "portal_report_created", targetType: "portal_report", targetId: created.id, details: report.title }).catch(() => undefined);
      return json({ report: { id: created.id } }, 201);
    }

    const [row] = await db.select().from(portalReports).where(eq(portalReports.id, Number(body.reportId))).limit(1);
    if (!row || (!isAdmin(member) && row.createdById !== member.id)) return json({ error: "Relato não encontrado." }, 404);

    if (action === "update") {
      if (!isAdmin(member)) return json({ error: "Só administradores mudam a situação dos relatos." }, 403);
      const status = isReportStatus(body.status) ? body.status : row.status;
      const response = String(body.response ?? row.response).replace(/\r\n/g, "\n").trim().slice(0, 2000);
      if (status === row.status && response === row.response) return json({ ok: true });
      await db.update(portalReports).set({ status, response, updatedByName: member.name, updatedAt: now }).where(eq(portalReports.id, row.id));
      if (row.createdById && row.createdById !== member.id) {
        const what = status !== row.status ? reportStatusLabels[status] : "Nova resposta";
        await notify(db, [row.createdById], member.name, `${what}: ${row.title}`);
      }
      await writeAudit(db, { actorUserId: member.userId, actorName: member.name, action: "portal_report_updated", targetType: "portal_report", targetId: row.id, details: `${reportStatusLabels[status]} · ${row.title}` }).catch(() => undefined);
      return json({ ok: true });
    }

    if (action === "delete") {
      if (!isOpenReport(row.status) || row.status !== "open") return json({ error: "Relatos em correção ou decididos ficam no histórico." }, 409);
      await db.delete(portalReports).where(eq(portalReports.id, row.id));
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida." }, 400);
  } catch (error) {
    console.error("portal report failed", error);
    return json({ error: "Não foi possível concluir esta operação agora." }, 500);
  }
}
