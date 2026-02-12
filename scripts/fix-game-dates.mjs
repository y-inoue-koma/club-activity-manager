import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DB_URL);

  try {
    console.log("Fixing game dates to 2025 and 2026...");

    // 既存のゲームを削除（No.26-38）
    const gameNumbers = [26, 27, 32, 33, 34, 35, 36, 37, 38];
    for (const gameNum of gameNumbers) {
      await connection.execute(
        "DELETE FROM gameResults WHERE gameNumber = ?",
        [gameNum]
      );
      console.log(`✓ Deleted game No.${gameNum}`);
    }

    // 修正されたデータを再度追加
    const newGames = [
      // No.26: 10/11 都市大高 中止
      {
        gameNumber: 26,
        gameDate: "2025-10-11",
        opponent: "都市大高",
        result: "cancelled",
        homeAway: null,
        teamScore: null,
        opponentScore: null,
        innings: null,
        notes: "中止",
      },
      // No.24: 11/2 昭和 中止
      {
        gameNumber: 24,
        gameDate: "2025-11-02",
        opponent: "昭和",
        result: "cancelled",
        homeAway: null,
        teamScore: null,
        opponentScore: null,
        innings: null,
        notes: "中止",
      },
      // No.25: 11/2 昭和 中止
      {
        gameNumber: 25,
        gameDate: "2025-11-02",
        opponent: "昭和",
        result: "cancelled",
        homeAway: null,
        teamScore: null,
        opponentScore: null,
        innings: null,
        notes: "中止",
      },
      // No.27: 11/9 早大学院 ● 1-17 (6回・雨天コールド)
      {
        gameNumber: 27,
        gameDate: "2025-11-09",
        opponent: "早大学院",
        result: "loss",
        homeAway: "後",
        teamScore: 1,
        opponentScore: 17,
        innings: "6回",
        notes: "雨天コールド",
      },
      // No.28: 11/9 慶應志木 ● 4-6 (9回)
      {
        gameNumber: 28,
        gameDate: "2025-11-09",
        opponent: "慶應志木",
        result: "loss",
        homeAway: "後",
        teamScore: 4,
        opponentScore: 6,
        innings: "9回",
        notes: null,
      },
      // No.29: 11/16 鷲宮 中止
      {
        gameNumber: 29,
        gameDate: "2025-11-16",
        opponent: "鷲宮",
        result: "cancelled",
        homeAway: null,
        teamScore: null,
        opponentScore: null,
        innings: null,
        notes: "中止",
      },
      // No.30: 11/16 鷲宮 中止
      {
        gameNumber: 30,
        gameDate: "2025-11-16",
        opponent: "鷲宮",
        result: "cancelled",
        homeAway: null,
        teamScore: null,
        opponentScore: null,
        innings: null,
        notes: "中止",
      },
      // No.31: 11/23 第四商業 中止
      {
        gameNumber: 31,
        gameDate: "2025-11-23",
        opponent: "第四商業",
        result: "cancelled",
        homeAway: null,
        teamScore: null,
        opponentScore: null,
        innings: null,
        notes: "中止",
      },
      // No.32: 11/23 第四商業 中止
      {
        gameNumber: 32,
        gameDate: "2025-11-23",
        opponent: "第四商業",
        result: "cancelled",
        homeAway: null,
        teamScore: null,
        opponentScore: null,
        innings: null,
        notes: "中止",
      },
      // No.33: 11/24 麗澤 ○ 11-4 (9回)
      {
        gameNumber: 33,
        gameDate: "2025-11-24",
        opponent: "麗澤",
        result: "win",
        homeAway: "後",
        teamScore: 11,
        opponentScore: 4,
        innings: "9回",
        notes: null,
      },
      // No.34: 11/24 麗澤 ○ 7-5 (9回)
      {
        gameNumber: 34,
        gameDate: "2025-11-24",
        opponent: "麗澤",
        result: "win",
        homeAway: "先",
        teamScore: 7,
        opponentScore: 5,
        innings: "9回",
        notes: null,
      },
      // No.35: 11/30 都市大高 ● 6-7 (9回)
      {
        gameNumber: 35,
        gameDate: "2025-11-30",
        opponent: "都市大高",
        result: "loss",
        homeAway: "先",
        teamScore: 6,
        opponentScore: 7,
        innings: "9回",
        notes: null,
      },
      // No.36: 11/30 都市大高 ● 2-4 (4回・日没コールド)
      {
        gameNumber: 36,
        gameDate: "2025-11-30",
        opponent: "都市大高",
        result: "loss",
        homeAway: "後",
        teamScore: 2,
        opponentScore: 4,
        innings: "4回",
        notes: "日没コールド",
      },
      // No.37: 1/11 東村山西 ● 0-3 (3回・合同練習)
      {
        gameNumber: 37,
        gameDate: "2026-01-11",
        opponent: "東村山西",
        result: "loss",
        homeAway: "先",
        teamScore: 0,
        opponentScore: 3,
        innings: "3回",
        notes: "合同練習",
      },
      // No.38: 1/11 東村山西 ○ 1-0 (3回・合同練習)
      {
        gameNumber: 38,
        gameDate: "2026-01-11",
        opponent: "東村山西",
        result: "win",
        homeAway: "後",
        teamScore: 1,
        opponentScore: 0,
        innings: "3回",
        notes: "合同練習",
      },
      // No.39: 1/11 東村山西 ● 2-3 (3回・合同練習・サヨナラ)
      {
        gameNumber: 39,
        gameDate: "2026-01-11",
        opponent: "東村山西",
        result: "loss",
        homeAway: "先",
        teamScore: 2,
        opponentScore: 3,
        innings: "3回",
        notes: "合同練習・サヨナラ",
      },
    ];

    console.log("\nAdding corrected game results...");
    for (const game of newGames) {
      await connection.execute(
        `INSERT INTO gameResults 
         (gameNumber, gameDate, opponent, result, homeAway, teamScore, opponentScore, innings, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          game.gameNumber,
          game.gameDate,
          game.opponent,
          game.result,
          game.homeAway,
          game.teamScore,
          game.opponentScore,
          game.innings,
          game.notes,
        ]
      );
      console.log(
        `✓ Added game No.${game.gameNumber}: ${game.opponent} (${game.gameDate}) - ${game.result}`
      );
    }

    console.log("\n✅ Game dates fixed!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
