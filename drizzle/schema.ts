import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, decimal } from "drizzle-orm/mysql-core";

// ── Users (認証・部員情報) ──
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Members (部員プロフィール) ──
export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  grade: mysqlEnum("grade", ["1", "2", "3"]).notNull(),
  position: varchar("position", { length: 50 }),
  uniformNumber: int("uniformNumber"),
  memberRole: mysqlEnum("memberRole", ["player", "manager", "coach"]).default("player").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

// ── Schedules (予定表) ──
export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  eventType: mysqlEnum("eventType", ["practice", "game", "meeting", "other"]).default("practice").notNull(),
  eventDate: date("eventDate", { mode: "string" }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM
  endTime: varchar("endTime", { length: 5 }),
  location: varchar("location", { length: 200 }),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

// ── Practice Menus (練習メニュー) ──
export const practiceMenus = mysqlTable("practiceMenus", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").references(() => schedules.id),
  category: mysqlEnum("category", ["batting", "fielding", "pitching", "running", "conditioning", "other"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  duration: int("duration"), // minutes
  targetGroup: varchar("targetGroup", { length: 100 }), // e.g. "投手", "内野手", "全員"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PracticeMenu = typeof practiceMenus.$inferSelect;
export type InsertPracticeMenu = typeof practiceMenus.$inferInsert;

// ── Player Records (個人成績) ──
export const playerRecords = mysqlTable("playerRecords", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").references(() => members.id).notNull(),
  recordDate: date("recordDate", { mode: "string" }).notNull(),
  // 打撃成績
  atBats: int("atBats").default(0),         // 打数
  hits: int("hits").default(0),              // 安打
  doubles: int("doubles").default(0),        // 二塁打
  triples: int("triples").default(0),        // 三塁打
  homeRuns: int("homeRuns").default(0),      // 本塁打
  rbis: int("rbis").default(0),              // 打点
  runs: int("runs").default(0),              // 得点
  strikeouts: int("strikeouts").default(0),  // 三振
  walks: int("walks").default(0),            // 四球
  stolenBases: int("stolenBases").default(0),// 盗塁
  // 投手成績
  inningsPitched: decimal("inningsPitched", { precision: 5, scale: 1 }).default("0"),
  earnedRuns: int("earnedRuns").default(0),
  pitchStrikeouts: int("pitchStrikeouts").default(0),
  pitchWalks: int("pitchWalks").default(0),
  hitsAllowed: int("hitsAllowed").default(0),
  wins: int("wins").default(0),
  losses: int("losses").default(0),
  // メモ
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerRecord = typeof playerRecords.$inferSelect;
export type InsertPlayerRecord = typeof playerRecords.$inferInsert;

// ── Absences (欠席連絡) ──
export const absences = mysqlTable("absences", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").references(() => members.id).notNull(),
  scheduleId: int("scheduleId").references(() => schedules.id),
  absenceDate: date("absenceDate", { mode: "string" }).notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "noted"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Absence = typeof absences.$inferSelect;
export type InsertAbsence = typeof absences.$inferInsert;
