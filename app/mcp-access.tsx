"use client";

// Meu perfil › Conectar uma IA (MCP): chaves pessoais para Claude, ChatGPT, Cursor... A chave aparece
// uma vez só; a IA age como a pessoa, com as mesmas permissões. Revogar corta o acesso na hora.
import { useCallback, useEffect, useState } from "react";
import Bot from "lucide-react/icons/bot";
import Copy from "lucide-react/icons/copy";
import KeyRound from "lucide-react/icons/key-round";
import { askConfirm } from "./confirm-dialog";
import { relativeTime } from "./task-shared";

type Token = { id: number; name: string; hint: string; createdAt: string; expiresAt: string; lastUsedAt: string | null };

async function send(payload: Record<string, unknown>) {
  const response = await fetch("/api/api-tokens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({})) as { error?: string; token?: string };
  if (!response.ok) throw new Error(data.error || "Não foi possível salvar.");
  return data;
}

export default function McpAccess() {
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const url = typeof window === "undefined" ? "/api/mcp" : `${window.location.origin}/api/mcp`;

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/api-tokens", { cache: "no-store" });
      const data = await response.json() as { tokens?: Token[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar as chaves.");
      setTokens(data.tokens ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar as chaves."); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function create() {
    setBusy(true); setError("");
    try { const data = await send({ action: "create", name: name.trim() || "Minha IA" }); setCreated(data.token ?? null); setName(""); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível criar."); } finally { setBusy(false); }
  }
  async function revoke(token: Token) {
    if (!(await askConfirm(`Revogar a chave "${token.name}"? A IA conectada com ela perde o acesso na hora.`, { confirmLabel: "Revogar", danger: true }))) return;
    try { await send({ action: "revoke", tokenId: token.id }); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível revogar."); }
  }
  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopied(label); window.setTimeout(() => setCopied(""), 2000); } catch { setCopied(""); }
  }

  const key = created ?? "SUA_CHAVE";
  const claudeCode = `claude mcp add --transport http portal ${url} --header "Authorization: Bearer ${key}"`;
  const jsonConfig = JSON.stringify({ mcpServers: { portal: { type: "http", url, headers: { Authorization: `Bearer ${key}` } } } }, null, 2);

  return <div className="mcp-access full">
    <div className="mcp-access-head"><Bot size={18} /><div><strong>Conectar uma IA (MCP)</strong><small>Converse com uma IA (Claude, ChatGPT, Cursor…) e peça para ela consultar e fazer coisas no Portal por você: ver e criar demandas, abrir chamados, anotar na agenda, ver avisos e o estoque. A IA age <b>como você</b>, com as suas permissões.</small></div></div>

    {created && <div className="mcp-created" role="status">
      <p><KeyRound size={14} /> <b>Copie a chave agora.</b> Ela não aparece de novo. Não compartilhe: quem tiver a chave age como você.</p>
      <div className="mcp-copy"><code>{created}</code><button type="button" className="secondary-button" onClick={() => void copy(created, "chave")}><Copy size={14} /> {copied === "chave" ? "Copiada" : "Copiar"}</button></div>
    </div>}

    <details className="mcp-howto" open={Boolean(created)}>
      <summary>Como conectar</summary>
      <ol>
        <li>Endereço do servidor: <code>{url}</code> <button type="button" className="link-button" onClick={() => void copy(url, "url")}>{copied === "url" ? "copiado" : "copiar"}</button></li>
        <li>Cabeçalho de autorização: <code>Authorization: Bearer {created ? "<sua chave>" : "SUA_CHAVE"}</code></li>
        <li><b>Claude Code</b> (terminal): <div className="mcp-copy"><code>{claudeCode}</code><button type="button" className="secondary-button" onClick={() => void copy(claudeCode, "cc")}><Copy size={14} /> {copied === "cc" ? "Copiado" : "Copiar"}</button></div></li>
        <li><b>Claude Desktop, Cursor e outros</b> (arquivo de configuração MCP): <div className="mcp-copy"><pre>{jsonConfig}</pre><button type="button" className="secondary-button" onClick={() => void copy(jsonConfig, "json")}><Copy size={14} /> {copied === "json" ? "Copiado" : "Copiar"}</button></div></li>
      </ol>
      <p className="mcp-note">Depois, é só pedir em português: “quais demandas minhas vencem esta semana?”, “abre um chamado para o Desenvolvimento sobre…”, “comenta na DEM-120 que…”. Antes de alterar algo, a IA deve confirmar com você.</p>
    </details>

    <div className="mcp-new">
      <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="Nome da chave (ex.: Claude no notebook)" aria-label="Nome da chave" />
      <button type="button" className="secondary-button" disabled={busy} onClick={() => void create()}><KeyRound size={14} /> {busy ? "Criando..." : "Criar chave"}</button>
    </div>
    {error && <p className="modal-error">{error}</p>}
    {tokens && tokens.length > 0 && <ul className="mcp-tokens">{tokens.map((token) => <li key={token.id}>
      <span><b>{token.name}</b> <code>…{token.hint}</code></span>
      <small>Criada {relativeTime(token.createdAt)} · {token.lastUsedAt ? `último uso ${relativeTime(token.lastUsedAt)}` : "ainda não usada"} · vale até {new Date(token.expiresAt).toLocaleDateString("pt-BR")}</small>
      <button type="button" className="secondary-button" onClick={() => void revoke(token)}>Revogar</button>
    </li>)}</ul>}
  </div>;
}
