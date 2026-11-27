// Aviso de novidades no sino para TODA a equipe, uma vez por versão publicada com novidade nova.
// Roda na primeira abertura do sino depois da publicação (não precisa de tarefa agendada). A marca
// "news_announced" (data da última novidade anunciada) só avança uma vez, mesmo com várias pessoas abrindo juntas.
import { and, eq, lt } from "drizzle-orm";
import type { getDb } from "../db";
import { appSettings, members, notifications } from "../db/schema";
import { newsNotice } from "./news";
import { NEWS } from "./news-source";

type Db = ReturnType<typeof getDb>;
const KEY = "news_announced";

export async function announceNews(db: Db) {
  const latest = NEWS[0];
  if (!latest) return 0;
  const now = new Date().toISOString();
  await db.insert(appSettings).values({ key: KEY, value: "", updatedAt: now }).onConflictDoNothing();
  // Só quem conseguir avançar a marca envia (evita aviso repetido quando várias pessoas abrem ao mesmo tempo).
  const [claimed] = await db.update(appSettings).set({ value: latest.date, updatedAt: now })
    .where(and(eq(appSettings.key, KEY), lt(appSettings.value, latest.date))).returning({ key: appSettings.key });
  if (!claimed) return 0;
  const people = await db.select({ id: members.id }).from(members).where(eq(members.active, true));
  const body = newsNotice(latest).slice(0, 140);
  for (let index = 0; index < people.length; index += 20) {
    await db.insert(notifications).values(people.slice(index, index + 20).map((person) => ({ memberId: person.id, kind: "news" as const, actorName: "Portal", body, createdAt: now })));
  }
  return people.length;
}
