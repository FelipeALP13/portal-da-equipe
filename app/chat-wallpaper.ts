// Fundo das conversas do chat, escolhido por cada pessoa: um dos fundos prontos ou uma foto própria.
// Regras puras e testadas; a escolha fica no navegador (localStorage) e vale para o chat e o painel lateral.

export const CHAT_WALLPAPER_KEY = "portal.chat.wallpaper";
export const CHAT_WALLPAPER_EVENT = "portal:chat-wallpaper";

export const wallpaperPresets = [
  { id: "listras", label: "Padrão" },
  { id: "liso", label: "Liso" },
  { id: "pontos", label: "Pontos" },
  { id: "traco", label: "Traço" },
  { id: "degrade", label: "Degradê" },
] as const;
export type WallpaperPreset = (typeof wallpaperPresets)[number]["id"];

/** Quanto a cor do chat cobre a foto (em %): mais alto = foto mais suave e texto mais fácil de ler. */
export const PHOTO_VEIL_MIN = 50;
export const PHOTO_VEIL_MAX = 90;
export const PHOTO_VEIL_DEFAULT = 75;

export type ChatWallpaper = { kind: "preset"; id: WallpaperPreset } | { kind: "photo"; url: string; veil: number };
export const DEFAULT_WALLPAPER: ChatWallpaper = { kind: "preset", id: "listras" };

/** Só fotos guardadas pelo próprio Portal (nada de endereço de outro site). */
export function isChatPhotoUrl(url: unknown): url is string {
  return typeof url === "string" && /^\/api\/media\?key=media(%2F|\/)chat(%2F|\/)[\w-]+\.(png|jpg|gif|webp)$/i.test(url);
}

export const clampVeil = (value: unknown) => {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(PHOTO_VEIL_MAX, Math.max(PHOTO_VEIL_MIN, number)) : PHOTO_VEIL_DEFAULT;
};

/** Lê o que ficou guardado; qualquer coisa estranha volta ao fundo padrão. */
export function parseWallpaper(raw: string | null | undefined): ChatWallpaper {
  if (!raw) return DEFAULT_WALLPAPER;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (value.kind === "preset" && wallpaperPresets.some((preset) => preset.id === value.id)) return { kind: "preset", id: value.id as WallpaperPreset };
    if (value.kind === "photo" && isChatPhotoUrl(value.url)) return { kind: "photo", url: value.url, veil: clampVeil(value.veil) };
  } catch { /* volta ao padrão */ }
  return DEFAULT_WALLPAPER;
}

/** Estilo da área das mensagens: a foto fica atrás de um véu na cor do chat, para o texto continuar legível. */
export function wallpaperStyle(wallpaper: ChatWallpaper): Record<string, string> | undefined {
  if (wallpaper.kind !== "photo") return undefined;
  const veil = `color-mix(in srgb, var(--cv-canvas) ${clampVeil(wallpaper.veil)}%, transparent)`;
  return { backgroundImage: `linear-gradient(${veil}, ${veil}), url("${wallpaper.url}")`, backgroundSize: "cover", backgroundPosition: "center" };
}
