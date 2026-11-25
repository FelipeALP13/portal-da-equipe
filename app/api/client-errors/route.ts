// Erros do navegador de quem está com o Portal aberto: vão para o log do Worker (Cloudflare → Observability),
// junto dos erros do servidor. Não grava nada no banco. Só aceita quem está logado e no próprio site.
import { getDb } from "../../../db";
import { getSessionMember } from "../../auth-session";
import { hasTrustedOrigin } from "../../request-security";
import { readJsonBody } from "../../api-input";
import { cleanClientError, ignoredClientError } from "../../client-errors";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) return json({ error: "Origem da solicitação não autorizada." }, 403);
    const member = await getSessionMember(getDb());
    if (!member?.active) return json({ error: "Entre com seu usuário e senha para acessar o sistema." }, 401);
    const body = await readJsonBody(request, 8000);
    if (body instanceof Response) return body;
    const report = cleanClientError(body);
    if (!report) return json({ error: "Erro sem mensagem." }, 400);
    if (!ignoredClientError(report.message, report.source)) console.error("client error", JSON.stringify({ ...report, memberId: member.id }));
    return json({ ok: true });
  } catch (error) {
    console.error("client error report failed", error);
    return json({ error: "Não foi possível registrar o erro." }, 500);
  }
}
