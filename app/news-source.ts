// O changelog do manual (docs/manual/novidades.md), embutido no build: serve à janela de novidades e ao aviso no sino.
import { parseNews } from "./news";

const files = import.meta.glob<string>("../docs/manual/novidades.md", { query: "?raw", import: "default", eager: true });

export const NEWS = parseNews(Object.values(files)[0] ?? "");
