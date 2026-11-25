// Cópia de segurança semanal do banco de produção, fora da Cloudflare (roda pela tarefa agendada do Windows).
//   node scripts/backup-semanal.mjs
// Baixa o banco com "cloudflare.mjs backup", guarda as 12 cópias mais novas em backups/ e anota o resultado em
// backups/backup.log. Os arquivos têm dados de clientes: ficam só neste computador (a pasta backups/ não vai para o Git).
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const dir = path.join(root, "backups");
const KEEP = 12;
mkdirSync(dir, { recursive: true });
const log = (text) => appendFileSync(path.join(dir, "backup.log"), `${new Date().toISOString()} ${text}\n`);

const result = spawnSync(process.execPath, [path.join(root, "scripts/cloudflare.mjs"), "backup"], { cwd: root, encoding: "utf8" });
if (result.status !== 0) {
  log(`FALHOU (código ${result.status}). Se a Cloudflare pediu login: node node_modules/wrangler/bin/wrangler.js login`);
  process.exit(1);
}

const copies = readdirSync(dir).filter((name) => name.endsWith(".sql")).map((name) => ({ name, time: statSync(path.join(dir, name)).mtimeMs })).sort((a, b) => b.time - a.time);
for (const old of copies.slice(KEEP)) rmSync(path.join(dir, old.name));
log(`ok: ${copies[0]?.name ?? "?"} (${Math.min(copies.length, KEEP)} cópias guardadas)`);
