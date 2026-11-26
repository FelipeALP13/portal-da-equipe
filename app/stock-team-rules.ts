// Estoque da Copa por time: cada time tem o seu. Regras puras (testadas), sem banco.

export type StockTeam = { id: number; name: string };

/**
 * Times cujo estoque a pessoa vê e mexe: administradores, todos; os demais, só os times de que fazem parte.
 * Os times da própria pessoa vêm primeiro (o primeiro é o que abre). Sem time, lista vazia (sem estoque).
 */
export function stockTeamsOf(role: string, allTeams: readonly StockTeam[], myTeamIds: readonly number[]): StockTeam[] {
  const mine = (team: StockTeam) => (myTeamIds.includes(team.id) ? 0 : 1);
  const sorted = [...allTeams].sort((a, b) => mine(a) - mine(b) || a.name.localeCompare(b.name, "pt-BR"));
  return role === "admin" ? sorted : sorted.filter((team) => myTeamIds.includes(team.id));
}

/**
 * O time pedido pela tela, se a pessoa tiver acesso. Senão, o primeiro dela que já tem itens
 * (withItems), para não abrir um estoque vazio; senão o primeiro dela; sem nenhum, null.
 */
export function pickStockTeam(available: readonly StockTeam[], requested: unknown, withItems: readonly number[] = []): number | null {
  const id = requested === null || requested === undefined || requested === "" ? NaN : Number(requested);
  if (Number.isInteger(id) && available.some((team) => team.id === id)) return id;
  return available.find((team) => withItems.includes(team.id))?.id ?? available[0]?.id ?? null;
}

/** A pessoa pode usar o estoque deste time? (Item sem time só administradores, que veem tudo.) */
export function canUseStockTeam(available: readonly StockTeam[], teamId: number | null | undefined): boolean {
  return typeof teamId === "number" && available.some((team) => team.id === teamId);
}
