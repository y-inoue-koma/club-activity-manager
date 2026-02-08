import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const mid = 1; // 川﨑涼大

// Batting Stats
await conn.execute(`INSERT INTO battingStats (memberId, period, games, plateAppearances, atBats, runs, hits, singles, doubles, triples, homeRuns, totalBases, rbis, stolenBasesTotal, stolenBases, sacrificeBunts, sacrificeFlies, walks, strikeouts, errors, battingAvg, onBasePercentage, sluggingPercentage, ops, vsLeftAtBats, vsLeftHits, vsLeftAvg, vsRightAtBats, vsRightHits, vsRightAvg) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  [mid, "5.7〜都②", 25, 72, 64, 13, 13, 13, 0, 0, 0, 13, 4, 8, 7, 1, 0, 6, 4, 8, "0.203", "0.271", "0.203", "0.475", 6, 1, "0.167", 57, 10, "0.175"]);
console.log("Batting → OK");

// Physical: 27m走
await conn.execute(`INSERT INTO physicalMeasurements (memberId, measureDate, category, value) VALUES (?,?,?,?)`, [mid, "2025-11-01", "sprint_27m", 4.32]);
// ベンチプレス
await conn.execute(`INSERT INTO physicalMeasurements (memberId, measureDate, category, value) VALUES (?,?,?,?)`, [mid, "2025-12-12", "bench_press", 250]);
// クリーン
await conn.execute(`INSERT INTO physicalMeasurements (memberId, measureDate, category, value) VALUES (?,?,?,?)`, [mid, "2025-11-21", "clean", 1080]);
// デッドリフト
await conn.execute(`INSERT INTO physicalMeasurements (memberId, measureDate, category, value) VALUES (?,?,?,?)`, [mid, "2025-12-12", "deadlift", 110]);

console.log("Physical → OK");
await conn.end();
console.log("Done!");
