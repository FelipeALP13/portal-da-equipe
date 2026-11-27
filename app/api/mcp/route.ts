// Servidor MCP do Portal (Model Context Protocol, transporte HTTP "streamable", sem estado).
// A IA (Claude, ChatGPT, Cursor...) manda JSON-RPC por POST com "Authorization: Bearer portal_...".
// A chave é pessoal: a IA age como a pessoa dona dela, com as mesmas permissões (ver app/mcp-tools.ts).
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { apiTokens, members } from "../../../db/schema";
import { writeAudit } from "../../audit";
import { bearerToken, hashApiToken, tokenIsUsable, TOUCH_EVERY_MS } from "../../mcp-auth";
import { tools, type ToolContext } from "../../mcp-tools";

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const INSTRUCTIONS = "Portal da Equipe: demandas, chamados internos, agenda, avisos e estoque da Copa. Você age como a pessoa dona da chave, com as permissões dela. Antes de alterar algo, confirme com a pessoa. Datas no formato AAAA-MM-DD; horário de Brasília.";

type RpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

const rpcResult = (id: RpcRequest["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const rpcError = (id: RpcRequest["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

function unauthorized(message: string) {
  return Response.json(rpcError(null, -32001, message), { status: 401, headers: { "Cache-Control": "no-store", "WWW-Authenticate": 'Bearer realm="Portal da Equipe"' } });
}

/** Pessoa dona da chave (ativa e com a chave dentro da validade). */
async function authenticate(request: Request) {
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return null;
  const db = getDb();
  const [row] = await db.select({ token: apiTokens, member: members }).from(apiTokens).innerJoin(members, eq(apiTokens.memberId, members.id)).where(eq(apiTokens.tokenHash, await hashApiToken(token))).limit(1);
  if (!row || !row.member.active || !tokenIsUsable(row.token, Date.now())) return null;
  if (!row.token.lastUsedAt || Date.now() - Date.parse(row.token.lastUsedAt) > TOUCH_EVERY_MS) {
    await db.update(apiTokens).set({ lastUsedAt: new Date().toISOString() }).where(eq(apiTokens.id, row.token.id)).catch(() => undefined);
  }
  return { member: row.member, tokenName: row.token.name };
}

async function handle(message: RpcRequest, ctx: ToolContext, tokenName: string) {
  const { id, method, params } = message;
  if (method === "initialize") {
    const asked = String(params?.protocolVersion ?? "");
    return rpcResult(id, {
      protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "portal-da-equipe", title: "Portal da Equipe", version: "1.0.0" },
      instructions: INSTRUCTIONS,
    });
  }
  if (method === "ping") return rpcResult(id, {});
  if (method === "tools/list") return rpcResult(id, { tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
  if (method === "tools/call") {
    const tool = tools.find((entry) => entry.name === params?.name);
    if (!tool) return rpcError(id, -32602, `Ferramenta desconhecida: ${String(params?.name)}`);
    const args = (params?.arguments && typeof params.arguments === "object" ? params.arguments : {}) as Record<string, unknown>;
    try {
      const output = await tool.run(args, ctx);
      if (ctx.areas.size) {
        await writeAudit(getDb(), { actorUserId: ctx.member.userId, actorName: ctx.member.name, action: "mcp_tool", targetType: "mcp", details: `${tool.name} via ${tokenName}`.slice(0, 200) }).catch(() => undefined);
      }
      return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(output, null, 2) }], structuredContent: Array.isArray(output) ? { itens: output } : output, isError: false });
    } catch (error) {
      // Erro da regra do Portal (sem permissão, dado inválido...): volta como texto para a IA explicar à pessoa.
      return rpcResult(id, { content: [{ type: "text", text: error instanceof Error ? error.message : "Não foi possível concluir." }], isError: true });
    }
  }
  if (method?.startsWith("notifications/")) return null;
  return rpcError(id, -32601, `Método não suportado: ${String(method)}`);
}

export async function POST(request: Request) {
  try {
    // Lê o corpo antes de tudo: responder sem consumir o pedido derruba o Worker no pedido seguinte.
    const body = await request.json().catch(() => null) as RpcRequest | RpcRequest[] | null;
    const auth = await authenticate(request);
    if (!auth) return unauthorized("Chave ausente, inválida, vencida ou revogada. Gere uma em Meu perfil › Conectar uma IA.");
    if (!body) return Response.json(rpcError(null, -32700, "JSON inválido."), { status: 400 });
    const ctx: ToolContext = { member: auth.member, origin: new URL(request.url).origin, areas: new Set() };
    const messages = Array.isArray(body) ? body : [body];
    const replies = [];
    for (const message of messages.slice(0, 20)) {
      const reply = await handle(message, ctx, auth.tokenName);
      if (reply && message.id !== undefined) replies.push(reply);
    }
    const headers: Record<string, string> = { "Cache-Control": "no-store" };
    // Áreas alteradas: o verificador ao vivo atualiza as telas de quem está com o Portal aberto.
    if (ctx.areas.size) headers["x-live-areas"] = [...ctx.areas].join(",");
    if (!replies.length) return new Response(null, { status: 202, headers });
    return Response.json(Array.isArray(body) ? replies : replies[0], { headers });
  } catch (error) {
    console.error("mcp failed", error);
    return Response.json(rpcError(null, -32603, "Erro interno no Portal."), { status: 500 });
  }
}

/** Sem fluxo de eventos do servidor (SSE): este servidor só responde a pedidos. */
export async function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
