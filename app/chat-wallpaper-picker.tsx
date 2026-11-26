"use client";

// Escolha do fundo das conversas: fundos prontos ou uma foto própria (com véu ajustável para manter a leitura).
import { useEffect, useRef, useState } from "react";
import ImagePlus from "lucide-react/icons/image-plus";
import X from "lucide-react/icons/x";
import { CHAT_WALLPAPER_EVENT, CHAT_WALLPAPER_KEY, PHOTO_VEIL_DEFAULT, PHOTO_VEIL_MAX, PHOTO_VEIL_MIN, clampVeil, parseWallpaper, wallpaperPresets, wallpaperStyle, type ChatWallpaper } from "./chat-wallpaper";

function readStored() { try { return parseWallpaper(window.localStorage.getItem(CHAT_WALLPAPER_KEY)); } catch { return parseWallpaper(null); } }

/** Fundo escolhido, igual em todas as conversas abertas (chat e painel lateral). */
export function useChatWallpaper(): [ChatWallpaper, (next: ChatWallpaper) => void] {
  const [wallpaper, setWallpaper] = useState<ChatWallpaper>(() => parseWallpaper(null));
  useEffect(() => {
    const sync = () => setWallpaper(readStored());
    const first = window.setTimeout(sync, 0);
    window.addEventListener(CHAT_WALLPAPER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.clearTimeout(first); window.removeEventListener(CHAT_WALLPAPER_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const save = (next: ChatWallpaper) => {
    try { window.localStorage.setItem(CHAT_WALLPAPER_KEY, JSON.stringify(next)); } catch { /* sem armazenamento: vale até fechar */ }
    setWallpaper(next);
    window.dispatchEvent(new Event(CHAT_WALLPAPER_EVENT));
  };
  return [wallpaper, save];
}

export function ChatWallpaperPicker({ wallpaper, onChange, onClose, upload }: { wallpaper: ChatWallpaper; onChange: (next: ChatWallpaper) => void; onClose: () => void; upload: (file: File) => Promise<{ url: string }> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const photo = wallpaper.kind === "photo" ? wallpaper : null;

  async function sendPhoto(file: File | undefined) {
    if (!file) return;
    setBusy(true); setError("");
    try { const { url } = await upload(file); onChange({ kind: "photo", url, veil: photo?.veil ?? PHOTO_VEIL_DEFAULT }); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível enviar a foto."); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  return <div className="modal-layer"><button className="backdrop" onClick={onClose} aria-label="Fechar janela" /><section className="modal chat-wallpaper-modal" role="dialog" aria-label="Fundo das conversas">
    <div className="modal-head"><div><h2>Fundo das conversas</h2><p>Vale para todos os canais e conversas, só para você e neste navegador.</p></div><button type="button" onClick={onClose} aria-label="Fechar"><X /></button></div>
    <div className="chat-wallpaper-body">
    <div className="chat-wallpaper-grid" role="group" aria-label="Fundos prontos">
      {wallpaperPresets.map((preset) => { const on = wallpaper.kind === "preset" && wallpaper.id === preset.id; return <button key={preset.id} type="button" className={on ? "active" : ""} aria-pressed={on} onClick={() => onChange({ kind: "preset", id: preset.id })}>
        <span className="chat-wallpaper-swatch cv-posts" data-wallpaper={preset.id} aria-hidden="true" />{preset.label}
      </button>; })}
      <button type="button" className={photo ? "active" : ""} aria-pressed={Boolean(photo)} disabled={busy} onClick={() => fileRef.current?.click()}>
        <span className="chat-wallpaper-swatch cv-posts photo" style={photo ? wallpaperStyle(photo) : undefined} aria-hidden="true">{!photo && <ImagePlus size={20} />}</span>{busy ? "Enviando…" : photo ? "Trocar foto" : "Sua foto"}
      </button>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden aria-label="Escolher foto para o fundo" onChange={(event) => void sendPhoto(event.target.files?.[0])} />
    </div>
    {photo && <label className="chat-wallpaper-veil"><span>Foto mais suave <small>(o texto fica mais fácil de ler)</small></span>
      <input type="range" min={PHOTO_VEIL_MIN} max={PHOTO_VEIL_MAX} step={5} value={photo.veil} onChange={(event) => onChange({ ...photo, veil: clampVeil(event.target.value) })} />
    </label>}
    {error && <p className="chat-wallpaper-error" role="alert">{error}</p>}
    <p className="chat-wallpaper-hint">Foto em PNG, JPG, GIF ou WebP de até 8 MB. Ela fica guardada no Portal como as imagens do chat.</p>
    </div>
    <div className="modal-actions"><button type="button" className="primary-button" onClick={onClose}>Pronto</button></div>
  </section></div>;
}
