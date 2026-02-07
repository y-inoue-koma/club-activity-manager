import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";
dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

// ── 部員データ ──
const memberData = [
  { name: "川﨑涼大", grade: "2", classNumber: "3", studentNumber: 11, kana: "カワサキ リョウタ" },
  { name: "西村啓志", grade: "2", classNumber: "7", studentNumber: 29, kana: "ニシムラ ケイジ" },
  { name: "島田祐希", grade: "2", classNumber: "9", studentNumber: 15, kana: "シマダ ユウキ" },
  { name: "鈴木福丸", grade: "2", classNumber: "9", studentNumber: 18, kana: "スズキ フクマル" },
  { name: "高橋遼太", grade: "2", classNumber: "9", studentNumber: 26, kana: "タカハシ リョウタ" },
  { name: "長野隼斗", grade: "2", classNumber: "9", studentNumber: 31, kana: "ナガノ ハヤト" },
  { name: "原夏葵", grade: "1", classNumber: "3", studentNumber: 32, kana: "ハラ ナツキ" },
  { name: "藤井力暉斗", grade: "1", classNumber: "4", studentNumber: 35, kana: "フジイ リキト" },
  { name: "渡辺隼平", grade: "1", classNumber: "5", studentNumber: 44, kana: "ワタナベ シュンペイ" },
  { name: "多田翔一郎", grade: "1", classNumber: "6", studentNumber: 18, kana: "タダ ショウイチロウ" },
  { name: "今道瑞貴", grade: "1", classNumber: "7", studentNumber: 7, kana: "イマミチ ミズキ" },
  { name: "佐藤汰一", grade: "1", classNumber: "7", studentNumber: 19, kana: "サトウ タイチ" },
  { name: "吉田真輝", grade: "1", classNumber: "7", studentNumber: 42, kana: "ヨシダ マサキ" },
  { name: "新保大地", grade: "1", classNumber: "3", studentNumber: 19, kana: "シンポ ダイチ" },
  { name: "秋田駿", grade: "1", classNumber: "9", studentNumber: 1, kana: "アキタ シュン" },
  { name: "藤井瑛己", grade: "1", classNumber: "1", studentNumber: 36, kana: "フジイ エイト" },
];

// ── 打者成績データ ──
const battingData = [
  { name: "川﨑涼大", games: 25, pa: 72, ab: 64, runs: 13, hits: 13, singles: 13, doubles: 0, triples: 0, hr: 0, tb: 13, rbi: 5, sbTotal: 7, sb: 5, sacBunt: 3, sacFly: 0, walks: 5, so: 16, errors: 1, obp: "0.250", avg: "0.203", slg: "0.203", ops: "0.453", vsLAb: 7, vsLH: 1, vsLAvg: "0.167", vsRAb: 57, vsRH: 10, vsRAvg: "0.175" },
  { name: "島田祐希", games: 26, pa: 80, ab: 66, runs: 10, hits: 11, singles: 8, doubles: 3, triples: 0, hr: 0, tb: 14, rbi: 3, sbTotal: 4, sb: 4, sacBunt: 1, sacFly: 0, walks: 13, so: 12, errors: 2, obp: "0.300", avg: "0.212", slg: "0.212", ops: "0.512", vsLAb: 14, vsLH: 0, vsLAvg: "0.000", vsRAb: 55, vsRH: 10, vsRAvg: "0.182" },
  { name: "鈴木福丸", games: 27, pa: 97, ab: 81, runs: 19, hits: 20, singles: 18, doubles: 1, triples: 1, hr: 0, tb: 23, rbi: 6, sbTotal: 8, sb: 7, sacBunt: 5, sacFly: 0, walks: 11, so: 14, errors: 5, obp: "0.330", avg: "0.284", slg: "0.284", ops: "0.614", vsLAb: 15, vsLH: 1, vsLAvg: "0.111", vsRAb: 76, vsRH: 12, vsRAvg: "0.207" },
  { name: "高橋遼太", games: 22, pa: 71, ab: 67, runs: 9, hits: 14, singles: 14, doubles: 0, triples: 0, hr: 0, tb: 14, rbi: 3, sbTotal: 5, sb: 3, sacBunt: 0, sacFly: 0, walks: 4, so: 10, errors: 2, obp: "0.254", avg: "0.209", slg: "0.209", ops: "0.463", vsLAb: 11, vsLH: 2, vsLAvg: "0.182", vsRAb: 48, vsRH: 9, vsRAvg: "0.214" },
  { name: "長野隼斗", games: 25, pa: 98, ab: 86, runs: 14, hits: 25, singles: 13, doubles: 4, triples: 6, hr: 2, tb: 47, rbi: 15, sbTotal: 9, sb: 7, sacBunt: 2, sacFly: 1, walks: 9, so: 15, errors: 3, obp: "0.357", avg: "0.547", slg: "0.547", ops: "0.904", vsLAb: 12, vsLH: 1, vsLAvg: "0.091", vsRAb: 82, vsRH: 26, vsRAvg: "0.351" },
  { name: "西村啓志", games: 28, pa: 109, ab: 89, runs: 20, hits: 25, singles: 18, doubles: 7, triples: 0, hr: 0, tb: 32, rbi: 14, sbTotal: 7, sb: 5, sacBunt: 3, sacFly: 1, walks: 16, so: 11, errors: 2, obp: "0.385", avg: "0.360", slg: "0.360", ops: "0.745", vsLAb: 16, vsLH: 2, vsLAvg: "0.182", vsRAb: 81, vsRH: 27, vsRAvg: "0.386" },
  { name: "佐藤汰一", games: 14, pa: 42, ab: 35, runs: 3, hits: 10, singles: 9, doubles: 1, triples: 0, hr: 0, tb: 11, rbi: 3, sbTotal: 2, sb: 2, sacBunt: 2, sacFly: 0, walks: 5, so: 4, errors: 2, obp: "0.381", avg: "0.343", slg: "0.314", ops: "0.695", vsLAb: 4, vsLH: 2, vsLAvg: "0.500", vsRAb: 46, vsRH: 12, vsRAvg: "0.300" },
  { name: "今道瑞貴", games: 25, pa: 85, ab: 75, runs: 11, hits: 20, singles: 18, doubles: 1, triples: 1, hr: 0, tb: 23, rbi: 9, sbTotal: 6, sb: 5, sacBunt: 3, sacFly: 0, walks: 7, so: 19, errors: 3, obp: "0.329", avg: "0.307", slg: "0.307", ops: "0.636", vsLAb: 11, vsLH: 3, vsLAvg: "0.300", vsRAb: 60, vsRH: 16, vsRAvg: "0.291" },
  { name: "多田翔一郎", games: 1, pa: 1, ab: 1, runs: 0, hits: 0, singles: 0, doubles: 0, triples: 0, hr: 0, tb: 0, rbi: 0, sbTotal: 0, sb: 0, sacBunt: 0, sacFly: 0, walks: 0, so: 0, errors: 0, obp: "0.000", avg: "0.000", slg: "0.000", ops: "0.000", vsLAb: 6, vsLH: 2, vsLAvg: "0.400", vsRAb: 6, vsRH: 2, vsRAvg: "0.400" },
  { name: "原夏葵", games: 28, pa: 112, ab: 94, runs: 20, hits: 29, singles: 24, doubles: 3, triples: 2, hr: 0, tb: 36, rbi: 10, sbTotal: 16, sb: 14, sacBunt: 5, sacFly: 1, walks: 12, so: 21, errors: 4, obp: "0.375", avg: "0.383", slg: "0.383", ops: "0.758", vsLAb: 15, vsLH: 4, vsLAvg: "0.308", vsRAb: 44, vsRH: 17, vsRAvg: "0.500" },
  { name: "渡辺隼平", games: 10, pa: 36, ab: 26, runs: 6, hits: 5, singles: 5, doubles: 0, triples: 0, hr: 0, tb: 5, rbi: 1, sbTotal: 3, sb: 3, sacBunt: 3, sacFly: 0, walks: 7, so: 11, errors: 3, obp: "0.364", avg: "0.192", slg: "0.192", ops: "0.556", vsLAb: 13, vsLH: 3, vsLAvg: "0.300", vsRAb: 55, vsRH: 8, vsRAvg: "0.190" },
  { name: "藤井力暉斗", games: 22, pa: 62, ab: 57, runs: 12, hits: 14, singles: 9, doubles: 1, triples: 3, hr: 1, tb: 24, rbi: 10, sbTotal: 6, sb: 5, sacBunt: 1, sacFly: 0, walks: 4, so: 10, errors: 0, obp: "0.306", avg: "0.421", slg: "0.421", ops: "0.727", vsLAb: 5, vsLH: 0, vsLAvg: "0.000", vsRAb: 33, vsRH: 10, vsRAvg: "0.323" },
  { name: "吉田真輝", games: 18, pa: 52, ab: 42, runs: 9, hits: 12, singles: 11, doubles: 1, triples: 0, hr: 0, tb: 13, rbi: 5, sbTotal: 5, sb: 5, sacBunt: 2, sacFly: 0, walks: 8, so: 9, errors: 4, obp: "0.400", avg: "0.310", slg: "0.310", ops: "0.710", vsLAb: 7, vsLH: 4, vsLAvg: "0.667", vsRAb: 31, vsRH: 5, vsRAvg: "0.185" },
  { name: "新保大地", games: 17, pa: 38, ab: 30, runs: 4, hits: 5, singles: 3, doubles: 2, triples: 0, hr: 0, tb: 7, rbi: 4, sbTotal: 2, sb: 1, sacBunt: 2, sacFly: 0, walks: 6, so: 7, errors: 1, obp: "0.306", avg: "0.233", slg: "0.233", ops: "0.539", vsLAb: 7, vsLH: 1, vsLAvg: "0.167", vsRAb: 17, vsRH: 0, vsRAvg: "0.000" },
  { name: "秋田駿", games: 1, pa: 1, ab: 1, runs: 0, hits: 0, singles: 0, doubles: 0, triples: 0, hr: 0, tb: 0, rbi: 0, sbTotal: 0, sb: 0, sacBunt: 0, sacFly: 0, walks: 0, so: 0, errors: 0, obp: "0.000", avg: "0.000", slg: "0.000", ops: "0.000", vsLAb: 0, vsLH: 0, vsLAvg: null, vsRAb: 0, vsRH: 0, vsRAvg: null },
  { name: "藤井瑛己", games: 16, pa: 46, ab: 40, runs: 6, hits: 10, singles: 7, doubles: 2, triples: 1, hr: 0, tb: 14, rbi: 4, sbTotal: 4, sb: 3, sacBunt: 1, sacFly: 0, walks: 5, so: 10, errors: 1, obp: "0.333", avg: "0.350", slg: "0.350", ops: "0.683", vsLAb: 2, vsLH: 1, vsLAvg: "0.500", vsRAb: 10, vsRH: 3, vsRAvg: "0.375" },
];

// ── 投手成績データ ──
const pitchingData = [
  { name: "島田祐希", games: 2, ip: "10", bf: 0, ha: 1, hra: 0, walks: 0, so: 0, er: 0, ra: 0, soRate: "0.000", era: "0.00", whip: "0.000", kPct: "0.0", bbPct: "0.0", fsPct: "0.00" },
  { name: "鈴木福丸", games: 26, ip: "65 1/3", bf: 294, ha: 66, hra: 2, walks: 40, so: 49, er: 31, ra: 43, soRate: "6.753", era: "4.27", whip: "1.654", kPct: "16.7", bbPct: "13.6", fsPct: "39.50" },
  { name: "長野隼斗", games: 2, ip: "2", bf: 13, ha: 5, hra: 0, walks: 0, so: 0, er: 4, ra: 4, soRate: "0.000", era: "18.00", whip: "2.500", kPct: "0.0", bbPct: "0.0", fsPct: "0.00" },
  { name: "佐藤汰一", games: 26, ip: "63 1/3", bf: 298, ha: 71, hra: 0, walks: 28, so: 33, er: 27, ra: 33, soRate: "4.692", era: "3.84", whip: "1.564", kPct: "11.1", bbPct: "9.4", fsPct: "38.97" },
  { name: "今道瑞貴", games: 8, ip: "23 1/3", bf: 100, ha: 18, hra: 0, walks: 10, so: 17, er: 8, ra: 14, soRate: "6.567", era: "3.10", whip: "1.202", kPct: "17.0", bbPct: "10.0", fsPct: "30.90" },
  { name: "多田翔一郎", games: 5, ip: "11", bf: 58, ha: 12, hra: 0, walks: 10, so: 8, er: 7, ra: 10, soRate: "6.545", era: "5.73", whip: "2.000", kPct: "13.8", bbPct: "17.2", fsPct: "27.80" },
  { name: "原夏葵", games: 2, ip: "2", bf: 10, ha: 1, hra: 0, walks: 0, so: 0, er: 0, ra: 0, soRate: "0.000", era: "0.00", whip: "0.500", kPct: "0.0", bbPct: "0.0", fsPct: "0.00" },
  { name: "藤井力暉斗", games: 16, ip: "42 1/3", bf: 209, ha: 47, hra: 0, walks: 19, so: 18, er: 16, ra: 41, soRate: "3.830", era: "3.40", whip: "1.560", kPct: "8.6", bbPct: "9.1", fsPct: "32.50" },
  { name: "秋田駿", games: 3, ip: "6 2/3", bf: 50, ha: 15, hra: 0, walks: 15, so: 3, er: 9, ra: 21, soRate: "4.090", era: "9.55", whip: "4.545", kPct: "6.0", bbPct: "30.0", fsPct: "29.41" },
];

// ── 投手球速データ ──
const pitchVelocityData = [
  { name: "藤井力暉斗", avgFB: 96.4, avgBK: 86.9, maxFB: null, maxBK: null },
  { name: "鈴木福丸", avgFB: 108, avgBK: 89.6, maxFB: 115, maxBK: null },
  { name: "佐藤汰一", avgFB: 106.5, avgBK: 90.6, maxFB: 120, maxBK: null },
  { name: "秋田駿", avgFB: 99.5, avgBK: 84.9, maxFB: null, maxBK: null },
  { name: "多田翔一郎", avgFB: 104.3, avgBK: 94.3, maxFB: 118, maxBK: null },
];

// ── 打球速度データ ──
const exitVelocityData = [
  { name: "西村啓志", avg: 137.8, max: 143, avgRank: 1, maxRank: 1 },
  { name: "島田祐希", avg: 122, max: 137, avgRank: 5, maxRank: 2 },
  { name: "長野隼斗", avg: 132.3, max: 136, avgRank: 2, maxRank: 3 },
  { name: "今道瑞貴", avg: 123.2, max: 135, avgRank: 4, maxRank: 4 },
  { name: "佐藤汰一", avg: 120.9, max: 135, avgRank: 6, maxRank: 4 },
  { name: "多田翔一郎", avg: 123.7, max: 132, avgRank: 3, maxRank: 6 },
  { name: "鈴木福丸", avg: 117, max: 123, avgRank: 7, maxRank: 7 },
  { name: "原夏葵", avg: 112.9, max: 119, avgRank: 9, maxRank: 8 },
  { name: "秋田駿", avg: 116.2, max: 119, avgRank: 8, maxRank: 8 },
  { name: "新保大地", avg: 107.3, max: 114, avgRank: 10, maxRank: 10 },
  { name: "高橋遼太", avg: 105.9, max: 108, avgRank: 11, maxRank: 11 },
  { name: "川﨑涼大", avg: 0, max: 0, avgRank: 12, maxRank: 12 },
  { name: "藤井力暉斗", avg: 0, max: 0, avgRank: 12, maxRank: 12 },
  { name: "渡辺隼平", avg: 0, max: 0, avgRank: 12, maxRank: 12 },
  { name: "吉田真輝", avg: 0, max: 0, avgRank: 12, maxRank: 12 },
  { name: "藤井瑛己", avg: 0, max: 0, avgRank: 12, maxRank: 12 },
];

// ── プルダウン球速データ ──
const pulldownData = [
  { name: "長野隼斗", avg: 125.4, max: 128, avgRank: 1, maxRank: 1 },
  { name: "島田祐希", avg: 118.4, max: 127, avgRank: 4, maxRank: 2 },
  { name: "鈴木福丸", avg: 123.6, max: 127, avgRank: 2, maxRank: 2 },
  { name: "今道瑞貴", avg: 117.6, max: 125, avgRank: 6, maxRank: 4 },
  { name: "多田翔一郎", avg: 119.2, max: 123, avgRank: 3, maxRank: 5 },
  { name: "西村啓志", avg: 113.6, max: 121, avgRank: 7, maxRank: 6 },
  { name: "原夏葵", avg: 118.4, max: 121, avgRank: 4, maxRank: 6 },
  { name: "秋田駿", avg: 113.6, max: 117, avgRank: 7, maxRank: 8 },
  { name: "高橋遼太", avg: 112.2, max: 114, avgRank: 9, maxRank: 9 },
  { name: "佐藤汰一", avg: 109.6, max: 113, avgRank: 10, maxRank: 10 },
  { name: "新保大地", avg: 103.2, max: 105, avgRank: 11, maxRank: 11 },
  { name: "川﨑涼大", avg: 0, max: 0, avgRank: 12, maxRank: 12 },
  { name: "藤井力暉斗", avg: 0, max: 0, avgRank: 12, maxRank: 12 },
  { name: "渡辺隼平", avg: 0, max: 0, avgRank: 12, maxRank: 12 },
  { name: "吉田真輝", avg: 0, max: 0, avgRank: 12, maxRank: 12 },
  { name: "藤井瑛己", avg: 0, max: 0, avgRank: 12, maxRank: 12 },
];

// ── フィジカルデータ ──
const physicalData = {
  sprint_27m: [
    { name: "川﨑涼大", records: [{ date: "2024-11-01", value: 4.32 }] },
    { name: "西村啓志", records: [{ date: "2024-11-01", value: 4.43 }] },
    { name: "島田祐希", records: [{ date: "2024-11-01", value: 4.19 }] },
    { name: "鈴木福丸", records: [{ date: "2024-11-01", value: 4.41 }] },
    { name: "高橋遼太", records: [{ date: "2024-11-01", value: 4.75 }] },
    { name: "長野隼斗", records: [{ date: "2024-11-01", value: 4.16 }] },
    { name: "原夏葵", records: [{ date: "2024-11-01", value: 4.06 }] },
    { name: "藤井力暉斗", records: [{ date: "2024-11-01", value: 4.25 }] },
    { name: "多田翔一郎", records: [{ date: "2024-11-01", value: 4.41 }] },
    { name: "今道瑞貴", records: [{ date: "2024-11-01", value: 3.94 }] },
    { name: "吉田真輝", records: [{ date: "2024-11-01", value: 4.50 }] },
    { name: "新保大地", records: [{ date: "2024-11-01", value: 4.47 }] },
    { name: "藤井瑛己", records: [{ date: "2024-11-01", value: 4.15 }] },
  ],
  bench_press: [
    { name: "島田祐希", records: [{ date: "2024-11-14", value: 90 }, { date: "2024-11-21", value: 1080 }] },
    { name: "鈴木福丸", records: [{ date: "2024-11-21", value: 1040 }, { date: "2024-11-27", value: 1040 }, { date: "2024-12-12", value: 960 }, { date: "2025-01-13", value: 1030 }] },
    { name: "長野隼斗", records: [{ date: "2024-11-21", value: 880 }, { date: "2024-12-12", value: 1000 }, { date: "2025-01-13", value: 800 }, { date: "2025-02-05", value: 600 }] },
    { name: "原夏葵", records: [{ date: "2024-11-21", value: 840 }, { date: "2024-11-27", value: 700 }, { date: "2024-12-12", value: 840 }, { date: "2025-01-13", value: 840 }] },
    { name: "藤井力暉斗", records: [{ date: "2024-11-14", value: 40 }, { date: "2024-11-21", value: 840 }, { date: "2024-11-27", value: 700 }, { date: "2024-12-12", value: 840 }, { date: "2025-01-13", value: 840 }] },
    { name: "多田翔一郎", records: [{ date: "2024-11-21", value: 1130 }, { date: "2024-11-27", value: 1010 }, { date: "2025-01-13", value: 750 }] },
    { name: "今道瑞貴", records: [{ date: "2024-12-12", value: 300 }, { date: "2025-01-13", value: 615 }, { date: "2025-02-05", value: 1120 }] },
    { name: "佐藤汰一", records: [{ date: "2024-11-14", value: 60 }, { date: "2024-11-21", value: 1000 }, { date: "2024-12-12", value: 920 }, { date: "2025-01-13", value: 960 }] },
    { name: "新保大地", records: [{ date: "2024-12-12", value: 650 }, { date: "2025-01-13", value: 762 }, { date: "2025-02-05", value: 965 }] },
    { name: "秋田駿", records: [{ date: "2024-11-14", value: 40 }, { date: "2024-11-21", value: 880 }, { date: "2024-12-12", value: 960 }, { date: "2025-01-13", value: 1040 }] },
    { name: "藤井瑛己", records: [{ date: "2024-12-12", value: 770 }, { date: "2025-01-13", value: 1200 }] },
    { name: "西村啓志", records: [{ date: "2024-11-21", value: 550 }, { date: "2024-12-12", value: 760 }, { date: "2025-02-05", value: 600 }] },
    { name: "渡辺隼平", records: [{ date: "2024-11-27", value: 1010 }, { date: "2024-12-12", value: 340 }, { date: "2025-01-13", value: 350 }, { date: "2025-02-05", value: 870 }] },
    { name: "吉田真輝", records: [{ date: "2024-12-12", value: 270 }, { date: "2025-01-13", value: 580 }] },
    { name: "川﨑涼大", records: [{ date: "2024-12-12", value: 250 }] },
    { name: "高橋遼太", records: [{ date: "2024-12-12", value: 260 }, { date: "2025-01-13", value: 635 }] },
  ],
  clean: [
    { name: "西村啓志", records: [{ date: "2024-11-19", value: 1200 }, { date: "2024-11-21", value: 1700 }, { date: "2025-01-13", value: 1000 }] },
    { name: "島田祐希", records: [{ date: "2024-11-14", value: 1100 }, { date: "2024-11-19", value: 2000 }, { date: "2024-11-21", value: 1120 }] },
    { name: "鈴木福丸", records: [{ date: "2024-11-19", value: 1200 }, { date: "2024-11-21", value: 1280 }, { date: "2024-11-27", value: 240 }, { date: "2025-01-13", value: 1040 }, { date: "2025-02-05", value: 1360 }] },
    { name: "高橋遼太", records: [{ date: "2024-11-14", value: 1500 }, { date: "2024-11-21", value: 1080 }, { date: "2025-01-13", value: 800 }, { date: "2025-02-05", value: 1200 }] },
    { name: "長野隼斗", records: [{ date: "2024-11-14", value: 1500 }, { date: "2024-11-21", value: 1200 }, { date: "2025-01-13", value: 1000 }] },
    { name: "原夏葵", records: [{ date: "2024-11-14", value: 1400 }, { date: "2024-11-21", value: 1080 }, { date: "2025-01-13", value: 1080 }, { date: "2025-02-05", value: 1360 }] },
    { name: "藤井力暉斗", records: [{ date: "2024-11-21", value: 1040 }, { date: "2024-11-27", value: 320 }, { date: "2025-01-13", value: 1040 }] },
    { name: "渡辺隼平", records: [{ date: "2025-01-13", value: 120 }, { date: "2025-02-05", value: 640 }] },
    { name: "多田翔一郎", records: [{ date: "2024-11-27", value: 960 }] },
    { name: "今道瑞貴", records: [{ date: "2024-11-14", value: 1100 }, { date: "2024-11-19", value: 800 }, { date: "2024-11-21", value: 1080 }, { date: "2025-01-13", value: 1040 }, { date: "2025-02-05", value: 960 }] },
    { name: "佐藤汰一", records: [{ date: "2024-11-14", value: 375 }, { date: "2024-11-21", value: 1080 }, { date: "2024-11-27", value: 960 }, { date: "2025-01-13", value: 1040 }] },
    { name: "吉田真輝", records: [{ date: "2024-11-19", value: 900 }, { date: "2025-01-13", value: 190 }] },
    { name: "新保大地", records: [{ date: "2024-11-19", value: 900 }, { date: "2024-11-21", value: 1080 }, { date: "2025-01-13", value: 960 }] },
    { name: "秋田駿", records: [{ date: "2024-11-19", value: 900 }, { date: "2024-11-21", value: 960 }] },
    { name: "藤井瑛己", records: [{ date: "2025-01-13", value: 960 }] },
    { name: "川﨑涼大", records: [{ date: "2024-11-21", value: 1080 }] },
  ],
  deadlift: [
    { name: "西村啓志", records: [{ date: "2024-11-19", value: 2000 }, { date: "2024-12-12", value: 2400 }, { date: "2025-01-13", value: 2400 }] },
    { name: "島田祐希", records: [{ date: "2024-11-14", value: 550 }, { date: "2024-11-19", value: 1500 }, { date: "2024-11-21", value: 3360 }, { date: "2024-12-12", value: 1980 }] },
    { name: "鈴木福丸", records: [{ date: "2024-11-14", value: 2420 }, { date: "2024-11-19", value: 1340 }, { date: "2024-11-21", value: 2490 }, { date: "2024-11-27", value: 1760 }, { date: "2024-12-12", value: 1920 }, { date: "2025-01-13", value: 2240 }] },
    { name: "高橋遼太", records: [{ date: "2024-11-14", value: 510 }, { date: "2024-12-12", value: 990 }, { date: "2025-01-13", value: 2000 }] },
    { name: "長野隼斗", records: [{ date: "2024-11-14", value: 2700 }, { date: "2024-11-19", value: 1000 }, { date: "2024-12-12", value: 2480 }, { date: "2025-01-13", value: 2400 }] },
    { name: "原夏葵", records: [{ date: "2024-11-14", value: 3330 }, { date: "2024-11-21", value: 2110 }, { date: "2024-12-12", value: 1920 }, { date: "2025-01-13", value: 2440 }] },
    { name: "藤井力暉斗", records: [{ date: "2024-11-14", value: 2200 }, { date: "2024-11-21", value: 2640 }, { date: "2024-11-27", value: 1520 }, { date: "2024-12-12", value: 1600 }, { date: "2025-01-13", value: 1920 }] },
    { name: "渡辺隼平", records: [{ date: "2024-12-12", value: 580 }, { date: "2025-01-13", value: 180 }, { date: "2025-02-05", value: 390 }] },
    { name: "多田翔一郎", records: [{ date: "2024-11-21", value: 1740 }, { date: "2024-12-12", value: 1440 }] },
    { name: "今道瑞貴", records: [{ date: "2024-11-14", value: 2430 }, { date: "2024-11-19", value: 970 }, { date: "2024-11-21", value: 1680 }, { date: "2024-12-12", value: 1920 }, { date: "2025-01-13", value: 1350 }] },
    { name: "佐藤汰一", records: [{ date: "2024-11-21", value: 2400 }, { date: "2024-11-27", value: 1920 }, { date: "2024-12-12", value: 1760 }, { date: "2025-01-13", value: 2000 }, { date: "2025-02-05", value: 2300 }] },
    { name: "吉田真輝", records: [{ date: "2024-11-19", value: 800 }, { date: "2024-12-12", value: 360 }, { date: "2025-01-13", value: 90 }] },
    { name: "新保大地", records: [{ date: "2024-11-19", value: 800 }, { date: "2024-11-21", value: 1600 }, { date: "2024-12-12", value: 1300 }, { date: "2025-02-05", value: 1800 }] },
    { name: "秋田駿", records: [{ date: "2024-11-14", value: 900 }, { date: "2024-11-19", value: 420 }, { date: "2024-11-21", value: 2640 }, { date: "2024-12-12", value: 1200 }, { date: "2025-01-13", value: 1920 }, { date: "2025-02-05", value: 2160 }] },
    { name: "藤井瑛己", records: [{ date: "2024-12-12", value: 1350 }] },
    { name: "川﨑涼大", records: [{ date: "2024-12-12", value: 110 }] },
  ],
};

// ── 試合結果データ ──
const gameResultsData = [
  { no: 1, date: "2025-07-23", opp: "岩槻商業", result: "draw", ha: "先", ts: 1, os: 1, inn: "7回", notes: "日没コールド" },
  { no: 2, date: "2025-08-02", opp: "牛久栄進", result: "win", ha: "先", ts: 3, os: 4, inn: "9回", notes: "サヨナラ（犠牲フライ）" },
  { no: 3, date: "2025-08-02", opp: "牛久栄進", result: "win", ha: "後", ts: 18, os: 4, inn: "9回", notes: "" },
  { no: 4, date: "2025-08-04", opp: "京華", result: "win", ha: "後", ts: 17, os: 9, inn: "9回", notes: "" },
  { no: 5, date: "2025-08-13", opp: "湖西", result: "loss", ha: "後", ts: 1, os: 13, inn: "9回", notes: "" },
  { no: 6, date: "2025-08-13", opp: "湖西", result: "draw", ha: "先", ts: 9, os: 9, inn: "9回", notes: "" },
  { no: 7, date: "2025-08-14", opp: "天竜", result: "win", ha: "先", ts: 1, os: 0, inn: "9回", notes: "2安打完封（鈴木）" },
  { no: 8, date: "2025-08-15", opp: "多摩・青梅総合・羽村", result: "win", ha: "後", ts: 13, os: 1, inn: "7回", notes: "7回コールド" },
  { no: 9, date: "2025-08-15", opp: "多摩・青梅総合・羽村", result: "loss", ha: "先", ts: 4, os: 5, inn: "5回", notes: "サヨナラ（ポテンヒット）" },
  { no: 10, date: "2025-08-24", opp: "成蹊", result: "loss", ha: "先", ts: 7, os: 8, inn: "9回", notes: "" },
  { no: 11, date: "2025-08-26", opp: "千歳丘", result: "win", ha: "後", ts: 5, os: 3, inn: "9回", notes: "" },
  { no: 12, date: "2025-08-26", opp: "千歳丘", result: "win", ha: "先", ts: 7, os: 6, inn: "9回", notes: "" },
  { no: 13, date: "2025-08-27", opp: "本郷", result: "win", ha: "後", ts: 2, os: 0, inn: "9回", notes: "" },
  { no: 14, date: "2025-08-27", opp: "本郷", result: "loss", ha: "先", ts: 4, os: 7, inn: "9回", notes: "" },
  { no: 15, date: "2025-08-28", opp: "上野学園", result: "loss", ha: "後", ts: 5, os: 7, inn: "9回", notes: "" },
  { no: 16, date: "2025-08-28", opp: "上野学園", result: "win", ha: "先", ts: 4, os: 1, inn: "9回", notes: "" },
  { no: 17, date: "2025-09-07", opp: "錦城学園", result: "loss", ha: "後", ts: 1, os: 10, inn: "9回", notes: "" },
  { no: 18, date: "2025-09-07", opp: "錦城学園", result: "loss", ha: "先", ts: 0, os: 24, inn: "7回", notes: "7回コールド" },
  { no: 19, date: "2025-09-14", opp: "六郷工科", result: "win", ha: "後", ts: 20, os: 1, inn: "5回", notes: "秋ブロック1回戦 5回コールド" },
  { no: 20, date: "2025-09-23", opp: "明大中野", result: "loss", ha: "後", ts: 0, os: 11, inn: "5回", notes: "秋ブロック決勝 5回完全試合" },
  { no: 21, date: "2025-09-28", opp: "安田学園", result: "loss", ha: "先", ts: 5, os: 6, inn: "9回", notes: "" },
  { no: 22, date: "2025-09-28", opp: "豊多摩", result: "loss", ha: "後", ts: 3, os: 8, inn: "8回", notes: "時間切れ" },
];

// ── チームスタッツ ──
const teamStatsData = {
  period: "2025新チーム",
  totalGames: 24,
  wins: 9,
  losses: 13,
  draws: 2,
  winRate: "0.38",
  teamBattingAvg: "0.249",
  teamSlugging: "0.324",
  teamOps: "0.509",
  teamEra: "4.21",
  teamWhip: "1.683",
  avgRunsScored: "5.4",
  avgRunsAllowed: "5.8",
};

async function seed() {
  console.log("🌱 Starting data seed...");

  // 1. Insert members
  console.log("📋 Inserting members...");
  for (const m of memberData) {
    await db.execute(sql`
      INSERT INTO members (name, grade, classNumber, studentNumber, kana, memberRole, isActive)
      VALUES (${m.name}, ${m.grade}, ${m.classNumber}, ${m.studentNumber}, ${m.kana}, 'player', 1)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);
  }

  // Get member IDs
  const [membersResult] = await db.execute(sql`SELECT id, name FROM members WHERE isActive = 1`);
  const memberMap = {};
  for (const row of membersResult) {
    memberMap[row.name] = row.id;
  }
  console.log(`  Found ${Object.keys(memberMap).length} members`);

  // 2. Insert batting stats
  console.log("⚾ Inserting batting stats...");
  for (const b of battingData) {
    const mid = memberMap[b.name];
    if (!mid) { console.log(`  ⚠ Member not found: ${b.name}`); continue; }
    await db.execute(sql`
      INSERT INTO battingStats (memberId, period, games, plateAppearances, atBats, runs, hits, singles, doubles, triples, homeRuns, totalBases, rbis, stolenBasesTotal, stolenBases, sacrificeBunts, sacrificeFlies, walks, strikeouts, errors, battingAvg, onBasePercentage, sluggingPercentage, ops, vsLeftAtBats, vsLeftHits, vsLeftAvg, vsRightAtBats, vsRightHits, vsRightAvg)
      VALUES (${mid}, '5.7〜都②', ${b.games}, ${b.pa}, ${b.ab}, ${b.runs}, ${b.hits}, ${b.singles}, ${b.doubles}, ${b.triples}, ${b.hr}, ${b.tb}, ${b.rbi}, ${b.sbTotal}, ${b.sb}, ${b.sacBunt}, ${b.sacFly}, ${b.walks}, ${b.so}, ${b.errors}, ${b.avg}, ${b.obp}, ${b.slg}, ${b.ops}, ${b.vsLAb}, ${b.vsLH}, ${b.vsLAvg}, ${b.vsRAb}, ${b.vsRH}, ${b.vsRAvg})
    `);
  }

  // 3. Insert pitching stats
  console.log("⚾ Inserting pitching stats...");
  for (const p of pitchingData) {
    const mid = memberMap[p.name];
    if (!mid) { console.log(`  ⚠ Member not found: ${p.name}`); continue; }
    await db.execute(sql`
      INSERT INTO pitchingStats (memberId, period, games, inningsPitched, battersFaced, hitsAllowed, homeRunsAllowed, walks, strikeouts, earnedRuns, runsAllowed, strikeoutRate, era, whip, kPercentage, bbPercentage, firstStrikePercentage)
      VALUES (${mid}, '7〜都②終', ${p.games}, ${p.ip}, ${p.bf}, ${p.ha}, ${p.hra}, ${p.walks}, ${p.so}, ${p.er}, ${p.ra}, ${p.soRate}, ${p.era}, ${p.whip}, ${p.kPct}, ${p.bbPct}, ${p.fsPct})
    `);
  }

  // 4. Insert pitch velocity
  console.log("🔫 Inserting pitch velocity...");
  for (const pv of pitchVelocityData) {
    const mid = memberMap[pv.name];
    if (!mid) { console.log(`  ⚠ Member not found: ${pv.name}`); continue; }
    await db.execute(sql`
      INSERT INTO pitchVelocity (memberId, avgFastball, avgBreaking, maxFastball, maxBreaking)
      VALUES (${mid}, ${pv.avgFB}, ${pv.avgBK}, ${pv.maxFB}, ${pv.maxBK})
    `);
  }

  // 5. Insert exit velocity
  console.log("💨 Inserting exit velocity...");
  for (const ev of exitVelocityData) {
    const mid = memberMap[ev.name];
    if (!mid) { console.log(`  ⚠ Member not found: ${ev.name}`); continue; }
    await db.execute(sql`
      INSERT INTO exitVelocity (memberId, measureDate, avgSpeed, maxSpeed, avgRank, maxRank)
      VALUES (${mid}, '2025-02-06', ${ev.avg}, ${ev.max}, ${ev.avgRank}, ${ev.maxRank})
    `);
  }

  // 6. Insert pulldown velocity
  console.log("💨 Inserting pulldown velocity...");
  for (const pd of pulldownData) {
    const mid = memberMap[pd.name];
    if (!mid) { console.log(`  ⚠ Member not found: ${pd.name}`); continue; }
    await db.execute(sql`
      INSERT INTO pulldownVelocity (memberId, measureDate, avgSpeed, maxSpeed, avgRank, maxRank)
      VALUES (${mid}, '2025-02-06', ${pd.avg}, ${pd.max}, ${pd.avgRank}, ${pd.maxRank})
    `);
  }

  // 7. Insert physical measurements
  console.log("💪 Inserting physical measurements...");
  for (const [category, entries] of Object.entries(physicalData)) {
    for (const entry of entries) {
      const mid = memberMap[entry.name];
      if (!mid) { console.log(`  ⚠ Member not found: ${entry.name}`); continue; }
      for (const rec of entry.records) {
        await db.execute(sql`
          INSERT INTO physicalMeasurements (memberId, measureDate, category, value)
          VALUES (${mid}, ${rec.date}, ${category}, ${rec.value})
        `);
      }
    }
  }

  // 8. Insert game results
  console.log("🏟 Inserting game results...");
  for (const g of gameResultsData) {
    await db.execute(sql`
      INSERT INTO gameResults (gameNumber, gameDate, opponent, result, homeAway, teamScore, opponentScore, innings, notes)
      VALUES (${g.no}, ${g.date}, ${g.opp}, ${g.result}, ${g.ha}, ${g.ts}, ${g.os}, ${g.inn}, ${g.notes})
    `);
  }

  // 9. Insert team stats
  console.log("📊 Inserting team stats...");
  const ts = teamStatsData;
  await db.execute(sql`
    INSERT INTO teamStats (period, totalGames, wins, losses, draws, winRate, teamBattingAvg, teamSlugging, teamOps, teamEra, teamWhip, avgRunsScored, avgRunsAllowed)
    VALUES (${ts.period}, ${ts.totalGames}, ${ts.wins}, ${ts.losses}, ${ts.draws}, ${ts.winRate}, ${ts.teamBattingAvg}, ${ts.teamSlugging}, ${ts.teamOps}, ${ts.teamEra}, ${ts.teamWhip}, ${ts.avgRunsScored}, ${ts.avgRunsAllowed})
  `);

  console.log("✅ Data seed completed!");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
