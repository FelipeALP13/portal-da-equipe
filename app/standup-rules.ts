// Daily da equipe: regras puras (testadas). A daily é só na segunda-feira.

/** Dia da semana da daily (0 = domingo, 1 = segunda). */
export const DAILY_WEEKDAY = 1;

/** Hoje (AAAA-MM-DD, horário de Brasília) é dia de daily? */
export function isDailyDay(isoDay: string) {
  return new Date(`${isoDay}T12:00:00Z`).getUTCDay() === DAILY_WEEKDAY;
}

/** A próxima segunda a partir de hoje (hoje mesmo, se for segunda), para avisar quando é a próxima daily. */
export function nextDailyDay(isoDay: string) {
  const date = new Date(`${isoDay}T12:00:00Z`);
  const ahead = (DAILY_WEEKDAY - date.getUTCDay() + 7) % 7;
  return new Date(date.getTime() + ahead * 86400000).toISOString().slice(0, 10);
}
