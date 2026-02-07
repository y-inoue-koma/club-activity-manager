import { and, desc, eq, gte, lte, asc, sql, SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  members, InsertMember,
  schedules, InsertSchedule,
  practiceMenus, InsertPracticeMenu,
  playerRecords, InsertPlayerRecord,
  absences, InsertAbsence,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Members ──
export async function listMembers(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = activeOnly ? eq(members.isActive, 1) : undefined;
  return db.select().from(members).where(conditions).orderBy(asc(members.grade), asc(members.name));
}

export async function getMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result[0];
}

export async function getMemberByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.userId, userId)).limit(1);
  return result[0];
}

export async function createMember(data: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(members).values(data);
  return { id: result[0].insertId };
}

export async function updateMember(id: number, data: Partial<InsertMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(members).set(data).where(eq(members.id, id));
}

export async function deleteMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(members).set({ isActive: 0 }).where(eq(members.id, id));
}

// ── Schedules ──
export async function listSchedules(from?: string, to?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: SQL[] = [];
  if (from) conditions.push(sql`${schedules.eventDate} >= ${from}`);
  if (to) conditions.push(sql`${schedules.eventDate} <= ${to}`);
  return db.select().from(schedules).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(schedules.eventDate), asc(schedules.startTime));
}

export async function getScheduleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(schedules).where(eq(schedules.id, id)).limit(1);
  return result[0];
}

export async function createSchedule(data: InsertSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schedules).values(data);
  return { id: result[0].insertId };
}

export async function updateSchedule(id: number, data: Partial<InsertSchedule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schedules).set(data).where(eq(schedules.id, id));
}

export async function deleteSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schedules).where(eq(schedules.id, id));
}

// ── Practice Menus ──
export async function listPracticeMenus(scheduleId?: number) {
  const db = await getDb();
  if (!db) return [];
  const condition = scheduleId ? eq(practiceMenus.scheduleId, scheduleId) : undefined;
  return db.select().from(practiceMenus).where(condition).orderBy(desc(practiceMenus.createdAt));
}

export async function createPracticeMenu(data: InsertPracticeMenu) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(practiceMenus).values(data);
  return { id: result[0].insertId };
}

export async function updatePracticeMenu(id: number, data: Partial<InsertPracticeMenu>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(practiceMenus).set(data).where(eq(practiceMenus.id, id));
}

export async function deletePracticeMenu(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(practiceMenus).where(eq(practiceMenus.id, id));
}

// ── Player Records ──
export async function listPlayerRecords(memberId: number, from?: string, to?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: SQL[] = [eq(playerRecords.memberId, memberId)];
  if (from) conditions.push(sql`${playerRecords.recordDate} >= ${from}`);
  if (to) conditions.push(sql`${playerRecords.recordDate} <= ${to}`);
  return db.select().from(playerRecords).where(and(...conditions)).orderBy(asc(playerRecords.recordDate));
}

export async function createPlayerRecord(data: InsertPlayerRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(playerRecords).values(data);
  return { id: result[0].insertId };
}

export async function updatePlayerRecord(id: number, data: Partial<InsertPlayerRecord>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(playerRecords).set(data).where(eq(playerRecords.id, id));
}

export async function deletePlayerRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(playerRecords).where(eq(playerRecords.id, id));
}

export async function getPlayerRecordsSummary(memberId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    totalAtBats: sql<number>`COALESCE(SUM(${playerRecords.atBats}), 0)`,
    totalHits: sql<number>`COALESCE(SUM(${playerRecords.hits}), 0)`,
    totalDoubles: sql<number>`COALESCE(SUM(${playerRecords.doubles}), 0)`,
    totalTriples: sql<number>`COALESCE(SUM(${playerRecords.triples}), 0)`,
    totalHomeRuns: sql<number>`COALESCE(SUM(${playerRecords.homeRuns}), 0)`,
    totalRbis: sql<number>`COALESCE(SUM(${playerRecords.rbis}), 0)`,
    totalRuns: sql<number>`COALESCE(SUM(${playerRecords.runs}), 0)`,
    totalStrikeouts: sql<number>`COALESCE(SUM(${playerRecords.strikeouts}), 0)`,
    totalWalks: sql<number>`COALESCE(SUM(${playerRecords.walks}), 0)`,
    totalStolenBases: sql<number>`COALESCE(SUM(${playerRecords.stolenBases}), 0)`,
    totalInningsPitched: sql<string>`COALESCE(SUM(${playerRecords.inningsPitched}), 0)`,
    totalEarnedRuns: sql<number>`COALESCE(SUM(${playerRecords.earnedRuns}), 0)`,
    totalPitchStrikeouts: sql<number>`COALESCE(SUM(${playerRecords.pitchStrikeouts}), 0)`,
    totalPitchWalks: sql<number>`COALESCE(SUM(${playerRecords.pitchWalks}), 0)`,
    totalHitsAllowed: sql<number>`COALESCE(SUM(${playerRecords.hitsAllowed}), 0)`,
    totalWins: sql<number>`COALESCE(SUM(${playerRecords.wins}), 0)`,
    totalLosses: sql<number>`COALESCE(SUM(${playerRecords.losses}), 0)`,
    gamesCount: sql<number>`COUNT(*)`,
  }).from(playerRecords).where(eq(playerRecords.memberId, memberId));
  return result[0] ?? null;
}

// ── Absences ──
export async function listAbsences(scheduleId?: number, memberId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (scheduleId) conditions.push(eq(absences.scheduleId, scheduleId));
  if (memberId) conditions.push(eq(absences.memberId, memberId));
  return db.select().from(absences).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(absences.createdAt));
}

export async function createAbsence(data: InsertAbsence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(absences).values(data);
  return { id: result[0].insertId };
}

export async function updateAbsenceStatus(id: number, status: "pending" | "approved" | "noted") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(absences).set({ status }).where(eq(absences.id, id));
}

// ── Upcoming schedules for reminders ──
export async function getSchedulesForDate(dateStr: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schedules).where(sql`${schedules.eventDate} = ${dateStr}`);
}
