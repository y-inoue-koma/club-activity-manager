import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Helper
async function q(sql, params = []) {
  const [rows] = await conn.execute(sql, params);
  return rows;
}

// ── 1. Clear existing data (keep members, clear stats) ──
console.log("Clearing existing stats data...");
await q("DELETE FROM battingStats");
await q("DELETE FROM pitchingStats");
await q("DELETE FROM pitchVelocity");
await q("DELETE FROM exitVelocity");
await q("DELETE FROM pulldownVelocity");
await q("DELETE FROM physicalMeasurements");
console.log("Cleared.");

// ── 2. Get member IDs ──
const allMembers = await q("SELECT id, name FROM members WHERE isActive = 1");
const memberMap = {};
for (const m of allMembers) {
  // Use last name for matching
  const lastName = m.name.split(" ")[0];
  memberMap[lastName] = m.id;
}
console.log("Members:", Object.keys(memberMap));

function getMemberId(name) {
  // Try exact match first
  if (memberMap[name]) return memberMap[name];
  // Try partial match
  for (const [key, id] of Object.entries(memberMap)) {
    if (key.includes(name) || name.includes(key)) return id;
  }
  console.warn(`Member not found: ${name}`);
  return null;
}

// ── 3. Batting Stats (打者成績) ──
console.log("\n=== Inserting Batting Stats ===");
const battingData = [
  { name: "川崎", games: 25, pa: 72, ab: 64, runs: 13, hits: 13, singles: 13, doubles: 0, triples: 0, hr: 0, tb: 13, rbi: 4, sbTotal: 8, sb: 7, sacBunt: 1, sacFly: 0, walks: 6, so: 4, errors: 8, avg: "0.203", obp: "0.271", slg: "0.203", ops: "0.475", vlAb: 6, vlH: 1, vlAvg: "0.167", vrAb: 57, vrH: 10, vrAvg: "0.175" },
  { name: "島田", games: 26, pa: 80, ab: 66, runs: 10, hits: 11, singles: 8, doubles: 3, triples: 0, hr: 0, tb: 14, rbi: 3, sbTotal: 2, sb: 2, sacBunt: 1, sacFly: 0, walks: 13, so: 16, errors: 9, avg: "0.167", obp: "0.304", slg: "0.212", ops: "0.516", vlAb: 11, vlH: 0, vlAvg: "0.000", vrAb: 55, vrH: 10, vrAvg: "0.182" },
  { name: "鈴木", games: 27, pa: 97, ab: 81, runs: 19, hits: 20, singles: 18, doubles: 1, triples: 1, hr: 0, tb: 23, rbi: 6, sbTotal: 2, sb: 1, sacBunt: 2, sacFly: 0, walks: 13, so: 15, errors: 11, avg: "0.247", obp: "0.351", slg: "0.284", ops: "0.635", vlAb: 9, vlH: 1, vlAvg: "0.111", vrAb: 58, vrH: 12, vrAvg: "0.207" },
  { name: "高橋", games: 22, pa: 71, ab: 67, runs: 9, hits: 14, singles: 14, doubles: 0, triples: 0, hr: 0, tb: 14, rbi: 10, sbTotal: 3, sb: 3, sacBunt: 2, sacFly: 2, walks: 0, so: 8, errors: 13, avg: "0.209", obp: "0.225", slg: "0.209", ops: "0.434", vlAb: 11, vlH: 2, vlAvg: "0.182", vrAb: 42, vrH: 9, vrAvg: "0.214" },
  { name: "長野", games: 25, pa: 98, ab: 86, runs: 14, hits: 25, singles: 13, doubles: 4, triples: 6, hr: 2, tb: 47, rbi: 21, sbTotal: 9, sb: 8, sacBunt: 2, sacFly: 2, walks: 8, so: 17, errors: 2, avg: "0.291", obp: "0.344", slg: "0.547", ops: "0.890", vlAb: 11, vlH: 1, vlAvg: "0.091", vrAb: 74, vrH: 26, vrAvg: "0.351" },
  { name: "西村", games: 28, pa: 109, ab: 89, runs: 20, hits: 25, singles: 18, doubles: 7, triples: 0, hr: 0, tb: 32, rbi: 6, sbTotal: 3, sb: 2, sacBunt: 1, sacFly: 1, walks: 18, so: 8, errors: 1, avg: "0.281", obp: "0.398", slg: "0.360", ops: "0.758", vlAb: 11, vlH: 2, vlAvg: "0.182", vrAb: 70, vrH: 27, vrAvg: "0.386" },
  { name: "佐藤", games: 14, pa: 42, ab: 35, runs: 3, hits: 10, singles: 9, doubles: 1, triples: 0, hr: 0, tb: 12, rbi: 7, sbTotal: 0, sb: 0, sacBunt: 1, sacFly: 1, walks: 5, so: 6, errors: 4, avg: "0.286", obp: "0.366", slg: "0.343", ops: "0.709", vlAb: 4, vlH: 2, vlAvg: "0.500", vrAb: 40, vrH: 12, vrAvg: "0.300" },
  { name: "今道", games: 25, pa: 85, ab: 75, runs: 11, hits: 20, singles: 18, doubles: 1, triples: 1, hr: 0, tb: 23, rbi: 7, sbTotal: 10, sb: 9, sacBunt: 4, sacFly: 0, walks: 6, so: 7, errors: 11, avg: "0.267", obp: "0.321", slg: "0.307", ops: "0.628", vlAb: 10, vlH: 3, vlAvg: "0.300", vrAb: 55, vrH: 16, vrAvg: "0.291" },
  { name: "多田", games: 1, pa: 1, ab: 1, runs: 0, hits: 0, singles: 0, doubles: 0, triples: 0, hr: 0, tb: 0, rbi: 0, sbTotal: 0, sb: 0, sacBunt: 0, sacFly: 0, walks: 0, so: 0, errors: 0, avg: "0.000", obp: "0.000", slg: "0.000", ops: "0.000", vlAb: 0, vlH: 0, vlAvg: null, vrAb: 5, vrH: 2, vrAvg: "0.400" },
  { name: "原", games: 28, pa: 112, ab: 94, runs: 20, hits: 29, singles: 24, doubles: 3, triples: 2, hr: 0, tb: 36, rbi: 12, sbTotal: 11, sb: 9, sacBunt: 1, sacFly: 1, walks: 15, so: 15, errors: 6, avg: "0.309", obp: "0.400", slg: "0.383", ops: "0.783", vlAb: 13, vlH: 4, vlAvg: "0.308", vrAb: 34, vrH: 17, vrAvg: "0.500" },
  { name: "渡辺", games: 10, pa: 36, ab: 26, runs: 6, hits: 5, singles: 5, doubles: 0, triples: 0, hr: 0, tb: 5, rbi: 1, sbTotal: 4, sb: 4, sacBunt: 3, sacFly: 0, walks: 7, so: 4, errors: 4, avg: "0.192", obp: "0.364", slg: "0.192", ops: "0.556", vlAb: 10, vlH: 3, vlAvg: "0.300", vrAb: 42, vrH: 8, vrAvg: "0.190" },
  { name: "藤井力", games: 22, pa: 62, ab: 57, runs: 12, hits: 14, singles: 9, doubles: 1, triples: 3, hr: 1, tb: 24, rbi: 8, sbTotal: 2, sb: 2, sacBunt: 0, sacFly: 0, walks: 3, so: 14, errors: 10, avg: "0.246", obp: "0.283", slg: "0.421", ops: "0.704", vlAb: 5, vlH: 0, vlAvg: "0.000", vrAb: 31, vrH: 10, vrAvg: "0.323" },
  { name: "吉田", games: 18, pa: 52, ab: 42, runs: 9, hits: 12, singles: 11, doubles: 1, triples: 0, hr: 0, tb: 13, rbi: 6, sbTotal: 3, sb: 1, sacBunt: 1, sacFly: 0, walks: 9, so: 10, errors: 2, avg: "0.286", obp: "0.412", slg: "0.310", ops: "0.721", vlAb: 6, vlH: 4, vlAvg: "0.667", vrAb: 27, vrH: 5, vrAvg: "0.185" },
  { name: "新保", games: 17, pa: 38, ab: 30, runs: 4, hits: 5, singles: 3, doubles: 2, triples: 0, hr: 0, tb: 7, rbi: 3, sbTotal: 1, sb: 1, sacBunt: 1, sacFly: 0, walks: 7, so: 11, errors: 3, avg: "0.167", obp: "0.324", slg: "0.233", ops: "0.558", vlAb: 6, vlH: 1, vlAvg: "0.167", vrAb: 12, vrH: 0, vrAvg: "0.000" },
  { name: "秋田", games: 1, pa: 1, ab: 1, runs: 0, hits: 0, singles: 0, doubles: 0, triples: 0, hr: 0, tb: 0, rbi: 0, sbTotal: 0, sb: 0, sacBunt: 0, sacFly: 0, walks: 0, so: 0, errors: 0, avg: "0.000", obp: "0.000", slg: "0.000", ops: "0.000", vlAb: 0, vlH: 0, vlAvg: null, vrAb: 0, vrH: 0, vrAvg: null },
  { name: "藤井瑛", games: 16, pa: 46, ab: 40, runs: 6, hits: 10, singles: 7, doubles: 2, triples: 1, hr: 0, tb: 14, rbi: 7, sbTotal: 4, sb: 3, sacBunt: 1, sacFly: 1, walks: 4, so: 11, errors: 0, avg: "0.250", obp: "0.311", slg: "0.350", ops: "0.661", vlAb: 2, vlH: 1, vlAvg: "0.500", vrAb: 8, vrH: 3, vrAvg: "0.375" },
];

for (const b of battingData) {
  const mid = getMemberId(b.name);
  if (!mid) continue;
  await q(`INSERT INTO battingStats (memberId, period, games, plateAppearances, atBats, runs, hits, singles, doubles, triples, homeRuns, totalBases, rbis, stolenBasesTotal, stolenBases, sacrificeBunts, sacrificeFlies, walks, strikeouts, errors, battingAvg, onBasePercentage, sluggingPercentage, ops, vsLeftAtBats, vsLeftHits, vsLeftAvg, vsRightAtBats, vsRightHits, vsRightAvg) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [mid, "5.7〜都②", b.games, b.pa, b.ab, b.runs, b.hits, b.singles, b.doubles, b.triples, b.hr, b.tb, b.rbi, b.sbTotal, b.sb, b.sacBunt, b.sacFly, b.walks, b.so, b.errors, b.avg, b.obp, b.slg, b.ops, b.vlAb, b.vlH, b.vlAvg, b.vrAb, b.vrH, b.vrAvg]);
  console.log(`  Batting: ${b.name} → OK`);
}

// ── 4. Pitching Stats (投手成績) ──
console.log("\n=== Inserting Pitching Stats ===");
const pitchingData = [
  { name: "島田", games: 2, ip: "10", bf: 10, ha: 1, hra: 0, bb: 3, so: 1, er: 0, ra: 3, soRate: "4.500", kbb: null, kbb2: null, bbPct: "30.0", kPct: "10.0", whip: "2.000", fs: "14.29", era: "0.00" },
  { name: "鈴木", games: null, ip: "65 1/3", bf: 294, ha: 66, hra: 2, bb: 40, so: 49, er: 31, ra: 43, soRate: "6.753", kbb: null, kbb2: null, bbPct: "13.6", kPct: "16.7", whip: "1.654", fs: "39.50", era: "4.27" },
  { name: "長野", games: 2, ip: "2", bf: 13, ha: 5, hra: 0, bb: 2, so: 1, er: 4, ra: 5, soRate: "4.500", kbb: null, kbb2: null, bbPct: "15.4", kPct: "7.7", whip: "3.500", fs: "40.0", era: "18.00" },
  { name: "佐藤", games: null, ip: "63 1/3", bf: 298, ha: 71, hra: 0, bb: 28, so: 33, er: 27, ra: 33, soRate: "4.692", kbb: null, kbb2: null, bbPct: "9.4", kPct: "11.1", whip: "1.564", fs: "38.97", era: "3.84" },
  { name: "今道", games: null, ip: "23 1/3", bf: 100, ha: 18, hra: 0, bb: 10, so: 17, er: 8, ra: 14, soRate: "6.567", kbb: null, kbb2: null, bbPct: "10.0", kPct: "17.0", whip: "1.202", fs: "30.9", era: "3.10" },
  { name: "多田", games: null, ip: "11", bf: 58, ha: 12, hra: 0, bb: 10, so: 8, er: 7, ra: 10, soRate: "6.545", kbb: null, kbb2: null, bbPct: "17.2", kPct: "13.8", whip: "2.000", fs: "27.8", era: "5.73" },
  { name: "原", games: 2, ip: "2", bf: 10, ha: 1, hra: 0, bb: 2, so: 1, er: 0, ra: 1, soRate: "4.500", kbb: null, kbb2: null, bbPct: "20.0", kPct: "10.0", whip: "1.500", fs: "20.0", era: "0.00" },
  { name: "藤井力", games: null, ip: "42 1/3", bf: 209, ha: 47, hra: 0, bb: 19, so: 18, er: 16, ra: 41, soRate: "3.830", kbb: null, kbb2: null, bbPct: "9.1", kPct: "8.6", whip: "1.560", fs: "32.5", era: "3.40" },
  { name: "秋田", games: null, ip: "6 2/3", bf: 50, ha: 15, hra: 0, bb: 15, so: 3, er: 9, ra: 21, soRate: "4.090", kbb: null, kbb2: null, bbPct: "30.0", kPct: "6.0", whip: "4.545", fs: "29.41", era: "9.55" },
];

for (const p of pitchingData) {
  const mid = getMemberId(p.name);
  if (!mid) continue;
  await q(`INSERT INTO pitchingStats (memberId, period, games, inningsPitched, battersFaced, hitsAllowed, homeRunsAllowed, walks, strikeouts, earnedRuns, runsAllowed, strikeoutRate, era, whip, kPercentage, bbPercentage, firstStrikePercentage) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [mid, "5.7〜都②", p.games, p.ip, p.bf, p.ha, p.hra, p.bb, p.so, p.er, p.ra, p.soRate, p.era, p.whip, p.kPct, p.bbPct, p.fs]);
  console.log(`  Pitching: ${p.name} → OK`);
}

// ── 5. Pitch Velocity (投手球速) ──
console.log("\n=== Inserting Pitch Velocity ===");
const velocityData = [
  { name: "藤井力", avgFB: 96.4, avgBK: 86.9, maxFB: 100, maxBK: 87 },
  { name: "鈴木", avgFB: 108, avgBK: 89.6, maxFB: 115, maxBK: 107 },
  { name: "佐藤", avgFB: 106.5, avgBK: 90.6, maxFB: 120, maxBK: 107 },
  { name: "秋田", avgFB: 99.5, avgBK: 84.9, maxFB: 118, maxBK: 98 },
  { name: "多田", avgFB: 104.3, avgBK: 94.3, maxFB: 109, maxBK: 99 },
];

for (const v of velocityData) {
  const mid = getMemberId(v.name);
  if (!mid) continue;
  await q(`INSERT INTO pitchVelocity (memberId, avgFastball, avgBreaking, maxFastball, maxBreaking) VALUES (?,?,?,?,?)`,
    [mid, v.avgFB, v.avgBK, v.maxFB, v.maxBK]);
  console.log(`  Velocity: ${v.name} → OK`);
}

// ── 6. Exit Velocity (打球速度) ──
console.log("\n=== Inserting Exit Velocity ===");
const exitData = [
  { name: "西村", avg: 137.8, max: 143, avgR: 1, maxR: 1 },
  { name: "島田", avg: 122, max: 137, avgR: 5, maxR: 2 },
  { name: "長野", avg: 132.3, max: 136, avgR: 2, maxR: 3 },
  { name: "今道", avg: 123.2, max: 135, avgR: 4, maxR: 4 },
  { name: "佐藤", avg: 120.9, max: 135, avgR: 6, maxR: 4 },
  { name: "多田", avg: 123.7, max: 132, avgR: 3, maxR: 6 },
  { name: "鈴木", avg: 117, max: 123, avgR: 7, maxR: 7 },
  { name: "原", avg: 112.9, max: 119, avgR: 9, maxR: 8 },
  { name: "秋田", avg: 116.2, max: 119, avgR: 8, maxR: 8 },
  { name: "新保", avg: 107.3, max: 114, avgR: 10, maxR: 10 },
  { name: "高橋", avg: 105.9, max: 108, avgR: 11, maxR: 11 },
];

for (const e of exitData) {
  const mid = getMemberId(e.name);
  if (!mid) continue;
  await q(`INSERT INTO exitVelocity (memberId, measureDate, avgSpeed, maxSpeed, avgRank, maxRank) VALUES (?,?,?,?,?,?)`,
    [mid, "2026-02-06", e.avg, e.max, e.avgR, e.maxR]);
  console.log(`  Exit Velocity: ${e.name} → OK`);
}

// ── 7. Pulldown Velocity (プルダウン球速) ──
console.log("\n=== Inserting Pulldown Velocity ===");
const pulldownData = [
  { name: "長野", avg: 125.4, max: 128, avgR: 1, maxR: 1 },
  { name: "島田", avg: 118.4, max: 127, avgR: 4, maxR: 2 },
  { name: "鈴木", avg: 123.6, max: 127, avgR: 2, maxR: 2 },
  { name: "今道", avg: 117.6, max: 125, avgR: 6, maxR: 4 },
  { name: "多田", avg: 119.2, max: 123, avgR: 3, maxR: 5 },
  { name: "西村", avg: 113.6, max: 121, avgR: 7, maxR: 6 },
  { name: "原", avg: 118.4, max: 121, avgR: 4, maxR: 6 },
  { name: "秋田", avg: 113.6, max: 117, avgR: 7, maxR: 8 },
  { name: "高橋", avg: 112.2, max: 114, avgR: 9, maxR: 9 },
  { name: "佐藤", avg: 109.6, max: 113, avgR: 10, maxR: 10 },
  { name: "新保", avg: 103.2, max: 105, avgR: 11, maxR: 11 },
];

for (const p of pulldownData) {
  const mid = getMemberId(p.name);
  if (!mid) continue;
  await q(`INSERT INTO pulldownVelocity (memberId, measureDate, avgSpeed, maxSpeed, avgRank, maxRank) VALUES (?,?,?,?,?,?)`,
    [mid, "2026-02-06", p.avg, p.max, p.avgR, p.maxR]);
  console.log(`  Pulldown: ${p.name} → OK`);
}

// ── 8. Physical Measurements (フィジカルデータ) ──
console.log("\n=== Inserting Physical Measurements ===");

// 27m走 (11/1)
const sprint27m = [
  { name: "川崎", val: 4.32 }, { name: "西村", val: 4.43 }, { name: "島田", val: 4.19 },
  { name: "鈴木", val: 4.41 }, { name: "高橋", val: 4.75 }, { name: "長野", val: 4.16 },
  { name: "原", val: 4.06 }, { name: "藤井力", val: 4.25 }, { name: "多田", val: 4.41 },
  { name: "今道", val: 3.94 }, { name: "吉田", val: 4.5 }, { name: "新保", val: 4.47 },
  { name: "藤井瑛", val: 4.15 },
];
for (const s of sprint27m) {
  const mid = getMemberId(s.name);
  if (!mid) continue;
  await q(`INSERT INTO physicalMeasurements (memberId, measureDate, category, value) VALUES (?,?,?,?)`,
    [mid, "2025-11-01", "sprint_27m", s.val]);
}
console.log("  27m走 → OK");

// ベンチプレス (multiple dates)
const benchDates = ["2025-11-14", "2025-11-21", "2025-11-27", "2025-12-12", "2026-01-13", "2026-02-05"];
const benchData = {
  "川崎": [null, null, null, 250, null, null],
  "西村": [null, 550, null, 760, null, 600],
  "島田": [null, 1080, null, 510, null, null],
  "鈴木": [null, 1040, 1040, 960, 1030, null],
  "高橋": [null, null, null, 260, 635, null],
  "長野": [null, 880, null, 1000, 800, 600],
  "原": [null, null, null, 300, 550, 1200],
  "藤井力": [null, 840, 700, 840, 840, null],
  "渡辺": [null, null, null, 1010, 340, 870],
  "多田": [null, null, 1130, 1010, 750, null],
  "今道": [null, null, null, 300, 615, 1120],
  "佐藤": [null, 1000, null, 920, 960, null],
  "吉田": [null, null, null, 270, 580, null],
  "新保": [null, null, null, 650, 762, 965],
  "秋田": [null, 880, null, 960, 1040, null],
  "藤井瑛": [null, null, null, 770, 1200, null],
};
for (const [name, values] of Object.entries(benchData)) {
  const mid = getMemberId(name);
  if (!mid) continue;
  for (let i = 0; i < values.length; i++) {
    if (values[i] != null) {
      await q(`INSERT INTO physicalMeasurements (memberId, measureDate, category, value) VALUES (?,?,?,?)`,
        [mid, benchDates[i], "bench_press", values[i]]);
    }
  }
}
console.log("  ベンチプレス → OK");

// クリーン (multiple dates)
const cleanDates = ["2025-11-14", "2025-11-19", "2025-11-21", "2025-11-27", "2026-01-13", "2026-02-05"];
const cleanData = {
  "川崎": [null, null, 1080, null, null, null],
  "西村": [null, 1200, 1700, null, 1000, null],
  "島田": [1100, 2000, 1120, null, null, null],
  "鈴木": [null, 1200, 1280, 240, 1040, 1360],
  "高橋": [1500, null, 1080, null, 800, 1200],
  "長野": [1500, null, 1200, null, 1000, null],
  "原": [1400, null, 1080, null, 1080, 1360],
  "藤井力": [null, null, 1040, 320, 1040, null],
  "渡辺": [null, null, null, null, 120, 640],
  "多田": [null, null, null, null, 960, null],
  "今道": [1100, 800, 1080, null, 1040, 960],
  "佐藤": [375, null, 1080, 960, 1040, null],
  "吉田": [null, 900, null, null, 190, null],
  "新保": [null, 900, 1080, null, 960, null],
  "秋田": [null, 900, 960, null, null, null],
  "藤井瑛": [null, null, null, null, 960, null],
};
for (const [name, values] of Object.entries(cleanData)) {
  const mid = getMemberId(name);
  if (!mid) continue;
  for (let i = 0; i < values.length; i++) {
    if (values[i] != null) {
      await q(`INSERT INTO physicalMeasurements (memberId, measureDate, category, value) VALUES (?,?,?,?)`,
        [mid, cleanDates[i], "clean", values[i]]);
    }
  }
}
console.log("  クリーン → OK");

// デッドリフト (multiple dates)
const dlDates = ["2025-11-14", "2025-11-19", "2025-11-21", "2025-11-27", "2025-12-12", "2026-01-13", "2026-02-05"];
const dlData = {
  "川崎": [null, null, null, null, 110, null, null],
  "西村": [null, 2000, null, null, 2400, 2400, null],
  "島田": [550, 1500, 3360, null, 1980, null, null],
  "鈴木": [2420, 1340, 2490, 1760, 1920, 2240, null],
  "高橋": [510, null, null, null, 990, 2000, null],
  "長野": [2700, null, 1000, null, 2480, 2400, null],
  "原": [3330, null, 2110, null, 1920, 2440, null],
  "藤井力": [2200, null, 2640, 1520, 1600, 1920, null],
  "渡辺": [null, null, null, null, 580, 180, 390],
  "多田": [null, null, 1740, null, null, 1440, null],
  "今道": [2430, 970, 1680, null, 1920, 1350, null],
  "佐藤": [null, null, 2400, 1920, 1760, 2000, 2300],
  "吉田": [null, 800, null, null, 360, 90, null],
  "新保": [null, 800, 1600, null, 1300, null, 1800],
  "秋田": [900, 420, 2640, null, 1200, 1920, 2160],
  "藤井瑛": [null, null, null, null, 1350, null, null],
};
for (const [name, values] of Object.entries(dlData)) {
  const mid = getMemberId(name);
  if (!mid) continue;
  for (let i = 0; i < values.length; i++) {
    if (values[i] != null) {
      await q(`INSERT INTO physicalMeasurements (memberId, measureDate, category, value) VALUES (?,?,?,?)`,
        [mid, dlDates[i], "deadlift", values[i]]);
    }
  }
}
console.log("  デッドリフト → OK");

// ── Summary ──
const [batCount] = await conn.execute("SELECT COUNT(*) as c FROM battingStats");
const [pitCount] = await conn.execute("SELECT COUNT(*) as c FROM pitchingStats");
const [velCount] = await conn.execute("SELECT COUNT(*) as c FROM pitchVelocity");
const [exitCount] = await conn.execute("SELECT COUNT(*) as c FROM exitVelocity");
const [pullCount] = await conn.execute("SELECT COUNT(*) as c FROM pulldownVelocity");
const [physCount] = await conn.execute("SELECT COUNT(*) as c FROM physicalMeasurements");

console.log("\n=== Summary ===");
console.log(`Batting Stats: ${batCount[0].c}`);
console.log(`Pitching Stats: ${pitCount[0].c}`);
console.log(`Pitch Velocity: ${velCount[0].c}`);
console.log(`Exit Velocity: ${exitCount[0].c}`);
console.log(`Pulldown Velocity: ${pullCount[0].c}`);
console.log(`Physical Measurements: ${physCount[0].c}`);

await conn.end();
console.log("\nDone!");
