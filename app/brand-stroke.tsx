// Assinatura visual do Portal: o traço diagonal do logo, repetido em ritmo. Usa a cor da marca,
// então continua valendo para qualquer empresa no white label.

const BARS = [
  { x: 150, size: 70 }, { x: 205, size: 130 }, { x: 260, size: 92 }, { x: 315, size: 176 },
  { x: 370, size: 118 }, { x: 425, size: 214, accent: true }, { x: 480, size: 150 }, { x: 535, size: 196 }, { x: 590, size: 104 },
];

export function BrandStroke({ className = "" }: { className?: string }) {
  return <svg className={`brand-stroke ${className}`} viewBox="0 0 700 260" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
    {BARS.map((bar, index) => <line key={bar.x} className={bar.accent ? "accent" : undefined} style={{ "--i": index } as React.CSSProperties} pathLength={1} x1={bar.x} y1={236} x2={bar.x + bar.size} y2={236 - bar.size} />)}
  </svg>;
}

const WEEK = [["S", "segunda-feira"], ["T", "terça-feira"], ["Q", "quarta-feira"], ["Q", "quinta-feira"], ["S", "sexta-feira"], ["S", "sábado"], ["D", "domingo"]] as const;

/** A semana em sete traços: o que já passou, hoje na cor da marca e o que ainda vem. */
export function WeekStroke({ today }: { today: string }) {
  const position = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  return <div className="week-stroke" role="img" aria-label={`Semana: hoje é ${WEEK[position][1]}`}>
    {WEEK.map(([letter], index) => <span key={index} className={index === position ? "today" : index < position ? "past" : undefined}><i /><b>{letter}</b></span>)}
  </div>;
}
