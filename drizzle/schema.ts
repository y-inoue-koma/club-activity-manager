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
  classNumber: varchar("classNumber", { length: 10 }),   // 組
  studentNumber: int("studentNumber"),                     // 番号
  kana: varchar("kana", { length: 100 }),                  // フリガナ
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
  startTime: varchar("startTime", { length: 20 }),
  endTime: varchar("endTime", { length: 20 }),
  location: varchar("location", { length: 200 }),
  uniform: varchar("uniform", { length: 50 }),  // ユニフォーム
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
  duration: int("duration"),
  targetGroup: varchar("targetGroup", { length: 100 }),
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
  atBats: int("atBats").default(0),
  hits: int("hits").default(0),
  doubles: int("doubles").default(0),
  triples: int("triples").default(0),
  homeRuns: int("homeRuns").default(0),
  rbis: int("rbis").default(0),
  runs: int("runs").default(0),
  strikeouts: int("strikeouts").default(0),
  walks: int("walks").default(0),
  stolenBases: int("stolenBases").default(0),
  inningsPitched: decimal("inningsPitched", { precision: 5, scale: 1 }).default("0"),
  earnedRuns: int("earnedRuns").default(0),
  pitchStrikeouts: int("pitchStrikeouts").default(0),
  pitchWalks: int("pitchWalks").default(0),
  hitsAllowed: int("hitsAllowed").default(0),
  wins: int("wins").default(0),
  losses: int("losses").default(0),
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

// ── Batting Stats (打者通算成績) ──
export const battingStats = mysqlTable("battingStats", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").references(() => members.id).notNull(),
  period: varchar("period", { length: 100 }),  // e.g. "5.7〜都②"
  games: int("games").default(0),
  plateAppearances: int("plateAppearances").default(0),  // 打席
  atBats: int("atBats").default(0),                       // 打数
  runs: int("runs").default(0),                            // 得点
  hits: int("hits").default(0),                            // 安打
  singles: int("singles").default(0),                      // 単打
  doubles: int("doubles").default(0),                      // 二塁打
  triples: int("triples").default(0),                      // 三塁打
  homeRuns: int("homeRuns").default(0),                    // 本塁打
  totalBases: int("totalBases").default(0),                // 塁打数
  rbis: int("rbis").default(0),                            // 打点
  stolenBasesTotal: int("stolenBasesTotal").default(0),    // 盗塁企図
  stolenBases: int("stolenBases").default(0),              // 盗塁成功
  sacrificeBunts: int("sacrificeBunts").default(0),        // 犠打
  sacrificeFlies: int("sacrificeFlies").default(0),        // 犠飛
  walks: int("walks").default(0),                          // 四死球
  strikeouts: int("strikeouts").default(0),                // 三振
  errors: int("errors").default(0),                        // 失策
  battingAvg: decimal("battingAvg", { precision: 4, scale: 3 }),    // 打率
  onBasePercentage: decimal("onBasePercentage", { precision: 4, scale: 3 }),  // 出塁率
  sluggingPercentage: decimal("sluggingPercentage", { precision: 4, scale: 3 }),  // 長打率
  ops: decimal("ops", { precision: 5, scale: 3 }),  // OPS
  // 左右別打率
  vsLeftAtBats: int("vsLeftAtBats").default(0),
  vsLeftHits: int("vsLeftHits").default(0),
  vsLeftAvg: decimal("vsLeftAvg", { precision: 4, scale: 3 }),
  vsRightAtBats: int("vsRightAtBats").default(0),
  vsRightHits: int("vsRightHits").default(0),
  vsRightAvg: decimal("vsRightAvg", { precision: 4, scale: 3 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BattingStat = typeof battingStats.$inferSelect;
export type InsertBattingStat = typeof battingStats.$inferInsert;

// ── Pitching Stats (投手通算成績) ──
export const pitchingStats = mysqlTable("pitchingStats", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").references(() => members.id).notNull(),
  period: varchar("period", { length: 100 }),
  games: int("games").default(0),
  inningsPitched: varchar("inningsPitched", { length: 20 }),  // e.g. "65 1/3"
  battersFaced: int("battersFaced").default(0),               // 打者数
  hitsAllowed: int("hitsAllowed").default(0),                 // 被安打
  homeRunsAllowed: int("homeRunsAllowed").default(0),         // 被本塁打
  walks: int("walks").default(0),                              // 四死球
  strikeouts: int("strikeouts").default(0),                    // 三振
  earnedRuns: int("earnedRuns").default(0),                    // 自責点
  runsAllowed: int("runsAllowed").default(0),                  // 失点
  strikeoutRate: decimal("strikeoutRate", { precision: 5, scale: 3 }),  // 奪三振率
  era: decimal("era", { precision: 5, scale: 2 }),                      // 防御率
  whip: decimal("whip", { precision: 5, scale: 3 }),                    // WHIP
  kPercentage: decimal("kPercentage", { precision: 5, scale: 1 }),      // K%
  bbPercentage: decimal("bbPercentage", { precision: 5, scale: 1 }),    // BB%
  firstStrikePercentage: decimal("firstStrikePercentage", { precision: 5, scale: 2 }),  // 初球S%
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PitchingStat = typeof pitchingStats.$inferSelect;
export type InsertPitchingStat = typeof pitchingStats.$inferInsert;

// ── Pitch Velocity (投手球速) ──
export const pitchVelocity = mysqlTable("pitchVelocity", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").references(() => members.id).notNull(),
  avgFastball: decimal("avgFastball", { precision: 5, scale: 1 }),
  avgBreaking: decimal("avgBreaking", { precision: 5, scale: 1 }),
  maxFastball: decimal("maxFastball", { precision: 5, scale: 1 }),
  maxBreaking: decimal("maxBreaking", { precision: 5, scale: 1 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PitchVelocityRecord = typeof pitchVelocity.$inferSelect;
export type InsertPitchVelocity = typeof pitchVelocity.$inferInsert;

// ── Exit Velocity (打球速度) ──
export const exitVelocity = mysqlTable("exitVelocity", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").references(() => members.id).notNull(),
  measureDate: date("measureDate", { mode: "string" }),
  avgSpeed: decimal("avgSpeed", { precision: 5, scale: 1 }),
  maxSpeed: decimal("maxSpeed", { precision: 5, scale: 1 }),
  avgRank: int("avgRank"),
  maxRank: int("maxRank"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExitVelocityRecord = typeof exitVelocity.$inferSelect;
export type InsertExitVelocity = typeof exitVelocity.$inferInsert;

// ── Pulldown Velocity (プルダウン球速) ──
export const pulldownVelocity = mysqlTable("pulldownVelocity", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").references(() => members.id).notNull(),
  measureDate: date("measureDate", { mode: "string" }),
  avgSpeed: decimal("avgSpeed", { precision: 5, scale: 1 }),
  maxSpeed: decimal("maxSpeed", { precision: 5, scale: 1 }),
  avgRank: int("avgRank"),
  maxRank: int("maxRank"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PulldownVelocityRecord = typeof pulldownVelocity.$inferSelect;
export type InsertPulldownVelocity = typeof pulldownVelocity.$inferInsert;

// ── Physical Measurements (フィジカル測定) ──
export const physicalMeasurements = mysqlTable("physicalMeasurements", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").references(() => members.id).notNull(),
  measureDate: date("measureDate", { mode: "string" }).notNull(),
  category: mysqlEnum("category", ["sprint_27m", "bench_press", "clean", "deadlift"]).notNull(),
  value: decimal("value", { precision: 8, scale: 2 }),  // 数値
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PhysicalMeasurement = typeof physicalMeasurements.$inferSelect;
export type InsertPhysicalMeasurement = typeof physicalMeasurements.$inferInsert;

// ── Game Results (試合結果) ──
export const gameResults = mysqlTable("gameResults", {
  id: int("id").autoincrement().primaryKey(),
  gameNumber: int("gameNumber"),
  gameDate: date("gameDate", { mode: "string" }).notNull(),
  opponent: varchar("opponent", { length: 200 }).notNull(),
  result: mysqlEnum("result", ["win", "loss", "draw", "cancelled"]).notNull(),
  homeAway: varchar("homeAway", { length: 10 }),  // 先/後
  teamScore: int("teamScore"),
  opponentScore: int("opponentScore"),
  innings: varchar("innings", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameResult = typeof gameResults.$inferSelect;
export type InsertGameResult = typeof gameResults.$inferInsert;

// ── Team Stats (チーム通算成績) ──
export const teamStats = mysqlTable("teamStats", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 100 }),
  totalGames: int("totalGames").default(0),
  wins: int("wins").default(0),
  losses: int("losses").default(0),
  draws: int("draws").default(0),
  winRate: decimal("winRate", { precision: 4, scale: 2 }),
  teamBattingAvg: decimal("teamBattingAvg", { precision: 4, scale: 3 }),
  teamSlugging: decimal("teamSlugging", { precision: 4, scale: 3 }),
  teamOps: decimal("teamOps", { precision: 5, scale: 3 }),
  teamEra: decimal("teamEra", { precision: 5, scale: 2 }),
  teamWhip: decimal("teamWhip", { precision: 5, scale: 3 }),
  avgRunsScored: decimal("avgRunsScored", { precision: 4, scale: 1 }),
  avgRunsAllowed: decimal("avgRunsAllowed", { precision: 4, scale: 1 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamStat = typeof teamStats.$inferSelect;
export type InsertTeamStat = typeof teamStats.$inferInsert;
