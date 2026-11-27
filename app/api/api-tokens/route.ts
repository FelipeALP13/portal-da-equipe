// Chaves pessoais para conectar uma IA pelo MCP. Cada pessoa cria e revoga as próprias chaves em
// Meu perfil. Só funciona com a sessão do navegador: uma IA conectada por chave não cria nem lista chaves.
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { apiTokens, notifications } from "../../../db/schema";
import { actingMember, getSessionMember } from "../../auth-session";
import { writeAudit } from "../../audit";
import { hasTrustedOrigin } from "../../request-security";
import { readJsonBody } from "../../api-input";
import { hashApiToken, MAX_TOKENS_PER_PERSON, newApiToken, TOKEN_DAYS } from "../../mcp-auth";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function browserMember() {
  if (actingMember.getStore()) return null;
  const db = getDb();
  const member = await getSessionMember(db);
  return member?.active ? member : null;
}

export async function GET() {
  try {
    const member = await browserMember();
    if (!member) return json({ error: "Entre com seu usuário e senha para acessar o sistema." }, 401);
    const rows = await getDb().select({ id: apiTokens.id, name: apiTokens.name, hint: apiTokens.hint, createdAt: apiTokens.createdAt, expiresAt: apiTokens.expiresAt, lastUsedAt: apiTokens.lastUsedAt })
      .from(apiTokens).where(eq(apiTokens.memberId, member.id)).orderBy(desc(apiTokens.createdAt));
    return json({ tokens: rows });
  } catch (error) {
    console.error("api tokens load failed", error);
    return json({ error: "Não foi possível carregar as chaves agora." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    // Lê o corpo antes de recusar: responder sem consumir o pedido derruba o Worker no pedido seguinte.
    const body = await readJsonBody(request);
    if (!hasTrustedOrigin(request)) return json({ error: "Origem da solicitação não autorizada." }, 403);
    const member = await browserMember();
    if (!member) return json({ error: "Entre com seu usuário e senha para acessar o sistema." }, 401);
    if (body instanceof Response) return body;
    const db = getDb();
    const now = new Date();

    if (body.action === "create") {
      const name = String(body.name ?? "").replace(/\s+/g, " ").trim().slice(0, 60) || "Minha IA";
      const existing = await db.select({ id: apiTokens.id }).from(apiTokens).where(eq(apiTokens.memberId, member.id));
      if (existing.length >= MAX_TOKENS_PER_PERSON) return json({ error: `Você já tem ${MAX_TOKENS_PER_PERSON} chaves. Revogue uma antes de criar outra.` }, 409);
      const token = newApiToken();
      const expiresAt = new Date(now.getTime() + TOKEN_DAYS * 86400000).toISOString();
      await db.insert(apiTokens).values({ memberId: member.id, name, tokenHash: await hashApiToken(token), hint: token.slice(-4), createdAt: now.toISOString(), expiresAt });
      // Aviso de segurança no sino: se não foi a pessoa, ela revoga na hora.
      await db.insert(notifications).values({ memberId: member.id, kind: "api_token", actorName: member.name, body: `Chave de IA criada: ${name}. Se não foi você, revogue em Meu perfil.`, createdAt: now.toISOString() }).catch(() => undefined);
      await writeAudit(db, { actorUserId: member.userId, actorName: member.name, action: "api_token_created", targetType: "api_token", details: name }).catch(() => undefined);
      // A chave só aparece agora; no banco fica apenas o resumo.
      return json({ token, name, expiresAt }, 201);
    }

    if (body.action === "revoke") {
      const [removed] = await db.delete(apiTokens).where(and(eq(apiTokens.id, Number(body.tokenId)), eq(apiTokens.memberId, member.id))).returning({ name: apiTokens.name });
      if (!removed) return json({ error: "Chave não encontrada." }, 404);
      await writeAudit(db, { actorUserId: member.userId, actorName: member.name, action: "api_token_revoked", targetType: "api_token", details: removed.name }).catch(() => undefined);
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida." }, 400);
  } catch (error) {
    console.error("api tokens failed", error);
    return json({ error: "Não foi possível concluir esta operação agora." }, 500);
  }
}
