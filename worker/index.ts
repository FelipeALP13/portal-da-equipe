import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import { bumpLiveVersion, isLiveRequest, liveResponse } from "./live";

const worker = {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const url = new URL(request.url);
    const https = url.protocol === "https:";
    // Fora do computador local, tudo vai para https (o http mandaria senha e sessão sem criptografia).
    if (!https && !LOCAL_HOSTS.has(url.hostname)) {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }
    if (isLiveRequest(url) && request.method === "GET") return liveResponse(env).then((response) => withSecurityHeaders(response, https));
    return Promise.resolve(runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx))).then((response) => {
      bumpLiveVersion(request, response, env, ctx);
      return withSecurityHeaders(apiNotFound(url, response), https);
    });
  },
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** Rota de API que não existe responde JSON (quem chama a API espera JSON, não a página 404). */
function apiNotFound(url: URL, response: Response) {
  if (response.status !== 404 || !url.pathname.startsWith("/api/") || !response.headers.get("content-type")?.includes("text/html")) return response;
  return Response.json({ error: "Rota não encontrada." }, { status: 404, headers: { "Cache-Control": "no-store" } });
}

/** Cabeçalhos de segurança em todas as respostas (sem mexer em respostas de troca de protocolo). */
function withSecurityHeaders(response: Response, https: boolean) {
  if (response.status === 101 || response.webSocket) return response;
  const secured = new Response(response.body, response);
  secured.headers.set("X-Content-Type-Options", "nosniff");
  secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // A câmera fica liberada só para o próprio Portal (leitor de código do estoque).
  secured.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(), payment=()");
  // Ninguém abre o Portal dentro de outro site (evita clique enganado por cima de uma página falsa).
  secured.headers.set("X-Frame-Options", "DENY");
  if (!secured.headers.has("Content-Security-Policy")) secured.headers.set("Content-Security-Policy", "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
  // Sistema interno: fora dos buscadores.
  secured.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (https) secured.headers.set("Strict-Transport-Security", "max-age=31536000");
  return secured;
}

export default worker;
