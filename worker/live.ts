// Atualização ao vivo: toda alteração bem-sucedida numa API anota um "número de versão" da ÁREA dela no
// banco (a área é o nome da rota: /api/tasks → "tasks", /api/inventory → "inventory"). As telas abertas
// consultam /api/live e só recarregam quando muda a área que elas mostram: uma demanda alterada não faz
// as 22 abas recarregarem o estoque. Cada área é uma linha em app_settings ("live:<área>"), só com um horário.

const PREFIX = "live:";
/** Rotas que mudam o tempo todo e já se atualizam sozinhas (ou que não mudam dados de tela). */
const IGNORED = ["/api/chat", "/api/notifications", "/api/push", "/api/link-preview", "/api/auth", "/api/live", "/api/gifs", "/api/media", "/api/activity", "/api/client-errors", "/api/search", "/api/counts"];

export function isLiveRequest(url: URL) {
  return url.pathname === "/api/live";
}

/** Área de uma rota da API: o primeiro trecho depois de /api/ (só letras, números e hífen). */
export function liveArea(pathname: string) {
  const area = pathname.split("/")[2] ?? "";
  return /^[a-z0-9-]{1,40}$/.test(area) ? area : null;
}

/** Responde /api/live com a versão de cada área (sem passar pelo resto do Portal). */
export async function liveResponse(env: Cloudflare.Env) {
  const versions: Record<string, string> = {};
  try {
    const rows = await env.DB?.prepare("select key, value from app_settings where key like 'live:%'").all<{ key: string; value: string }>();
    for (const row of rows?.results ?? []) versions[row.key.slice(PREFIX.length)] = row.value;
  } catch { /* sem banco: sem versões, e as telas simplesmente não recarregam */ }
  return Response.json({ versions }, { headers: { "Cache-Control": "no-store" } });
}

/** Depois de uma alteração bem-sucedida, anota a nova versão da área (sem atrasar a resposta). */
export function bumpLiveVersion(request: Request, response: Response, env: Cloudflare.Env, ctx: ExecutionContext) {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") return;
  if (response.status >= 400) return;
  const path = new URL(request.url).pathname;
  if (!path.startsWith("/api/") || IGNORED.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return;
  const area = liveArea(path);
  const db = env.DB;
  if (!db || !area) return;
  const now = new Date().toISOString();
  ctx.waitUntil(db.prepare("insert into app_settings (key, value, updated_at) values (?, ?, ?) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at")
    .bind(PREFIX + area, String(Date.now()), now).run().catch((error: unknown) => console.error("live version failed", error)));
}
