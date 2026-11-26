// Estoque da Copa por time (servidor): de quais times a pessoa logada vê e mexe no estoque.
import { eq, isNotNull } from "drizzle-orm";
import type { getDb } from "../db";
import { items, teamMembers, teams } from "../db/schema";
import { pickStockTeam, stockTeamsOf, type StockTeam } from "./stock-team-rules";

type Db = ReturnType<typeof getDb>;

export async function loadStockTeams(db: Db, member: { id: number; role: string }): Promise<StockTeam[]> {
  const [allTeams, mine] = await Promise.all([
    db.select({ id: teams.id, name: teams.name }).from(teams),
    db.select({ teamId: teamMembers.teamId }).from(teamMembers).where(eq(teamMembers.memberId, member.id)),
  ]);
  return stockTeamsOf(member.role, allTeams, mine.map((row) => row.teamId));
}

/** Times da pessoa + o estoque que a tela deve mostrar (o pedido, se ela tiver acesso). */
export async function resolveStockTeam(db: Db, member: { id: number; role: string }, requested: unknown) {
  const [stockTeams, stocked] = await Promise.all([
    loadStockTeams(db, member),
    db.selectDistinct({ teamId: items.teamId }).from(items).where(isNotNull(items.teamId)),
  ]);
  return { stockTeams, stockTeamId: pickStockTeam(stockTeams, requested, stocked.map((row) => row.teamId!)) };
}

