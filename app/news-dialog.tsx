"use client";

// Janela "Novidades do Portal": abre sozinha para quem ainda não viu as novidades da versão publicada
// (marcado por pessoa, neste navegador) e também pelo aviso de novidades no sino.
import { Fragment, useEffect, useState, type ReactNode } from "react";
import Sparkles from "lucide-react/icons/sparkles";
import X from "lucide-react/icons/x";
import { parseInline, type ManualInline } from "./manual-markdown";
import { newsSince, type NewsDay } from "./news";
import { NEWS } from "./news-source";

const seenKey = (userId: string) => `portal.news.seen:${userId}`;

function Inline({ tokens }: { tokens: ManualInline[] }): ReactNode {
  return tokens.map((token, index) => {
    if (token.type === "text") return <Fragment key={index}>{token.text}</Fragment>;
    if (token.type === "code") return <code key={index}>{token.text}</code>;
    if (token.type === "strong") return <strong key={index}><Inline tokens={token.children} /></strong>;
    // Links do changelog apontam para capítulos do manual: aqui viram só o nome do capítulo (a Ajuda tem o manual).
    return <em key={index}><Inline tokens={token.children} /></em>;
  });
}

function fullDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });
}

export default function NewsDialog({ userId, request, onOpenHelp }: { userId: string | null; request: number; onOpenHelp: () => void }) {
  const [days, setDays] = useState<NewsDay[] | null>(null);

  // Ao entrar: mostra o que a pessoa ainda não viu.
  useEffect(() => {
    if (!userId) return;
    const timer = window.setTimeout(() => {
      let seen: string | null = null;
      try { seen = window.localStorage.getItem(seenKey(userId)); } catch { /* sem armazenamento */ }
      const pending = newsSince(NEWS, seen);
      if (pending.length) setDays(pending);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [userId]);
  // Pelo sino: mostra as últimas novidades, mesmo já vistas.
  useEffect(() => { if (request) { const timer = window.setTimeout(() => setDays(NEWS.slice(0, 3)), 0); return () => window.clearTimeout(timer); } }, [request]);

  if (!days?.length) return null;
  function close() {
    if (userId && NEWS[0]) { try { window.localStorage.setItem(seenKey(userId), NEWS[0].date); } catch { /* sem armazenamento */ } }
    setDays(null);
  }

  return <div className="modal-layer"><button className="backdrop" onClick={close} aria-label="Fechar janela" />
    <section className="modal news-dialog" role="dialog" aria-modal="true" aria-labelledby="news-title">
      <div className="modal-head"><div><h2 id="news-title"><Sparkles size={18} /> Novidades do Portal</h2><p>O que mudou desde a sua última visita.</p></div><button type="button" onClick={close} aria-label="Fechar"><X /></button></div>
      <div className="news-days">
        {days.map((day) => <div key={day.date} className="news-day">
          <h3>{fullDate(day.date)}</h3>
          <ul>{day.items.map((item, index) => <li key={index}><Inline tokens={parseInline(item)} /></li>)}</ul>
        </div>)}
      </div>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => { close(); onOpenHelp(); }}>Ver todas na Ajuda</button><button type="button" className="primary-button" autoFocus onClick={close}>Entendi</button></div>
    </section>
  </div>;
}
