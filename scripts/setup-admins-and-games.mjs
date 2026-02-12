import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DB_URL);

  try {
    // 1. 管理者メールアドレスを設定
    const adminEmails = [
      "y-inoue@komagome.ed.jp",
      "harashima@komagome.ed.jp",
      "hirabayashi@komagome.ed.jp",
    ];

    console.log("Setting admin roles for specified emails...");
    for (const email of adminEmails) {
      await connection.execute(
        "UPDATE users SET role = 'admin' WHERE email = ?",
        [email]
      );
      console.log(`✓ Set admin role for ${email}`);
    }

    // 2. 10月以降の試合結果を追加
    const newGames = [
      // No.26: 11/9 vs 早大学院 ● 1-17 (6回・雨天コールド)
      {
        gameNumber: 26,
        gameDate: "2024-11-09",
        opponent: "早大学院",
        result: "loss",
        homeAway: "後",
        teamScore: 1,
        opponentScore: 17,
        innings: "6回",
        notes: "雨天コールド",
      },
      // No.27: 11/9 vs 慶應志木 ● 4-6 (9回)
      {
        gameNumber: 27,
        gameDate: "2024-11-09",
        opponent: "慶應志木",
        result: "loss",
        homeAway: "後",
        teamScore: 4,
        opponentScore: 6,
        innings: "9回",
        notes: null,
      },
      // No.32: 11/24 vs 麗澤 ○ 11-4 (9回)
      {
        gameNumber: 32,
        gameDate: "2024-11-24",
        opponent: "麗澤",
        result: "win",
        homeAway: "後",
        teamScore: 11,
        opponentScore: 4,
        innings: "9回",
        notes: null,
      },
      // No.33: 11/24 vs 麗澤 ○ 7-5 (9回)
      {
        gameNumber: 33,
        gameDate: "2024-11-24",
        opponent: "麗澤",
        result: "win",
        homeAway: "先",
        teamScore: 7,
        opponentScore: 5,
        innings: "9回",
        notes: null,
      },
      // No.34: 11/30 vs 都市大高 ● 6-7 (9回)
      {
        gameNumber: 34,
        gameDate: "2024-11-30",
        opponent: "都市大高",
        result: "loss",
        homeAway: "先",
        teamScore: 6,
        opponentScore: 7,
        innings: "9回",
        notes: null,
      },
      // No.35: 11/30 vs 都市大高 ● 2-4 (4回・日没コールド)
      {
        gameNumber: 35,
        gameDate: "2024-11-30",
        opponent: "都市大高",
        result: "loss",
        homeAway: "後",
        teamScore: 2,
        opponentScore: 4,
        innings: "4回",
        notes: "日没コールド",
      },
      // No.36: 1/11 vs 東村山西 ● 0-3 (3回・合同練習)
      {
        gameNumber: 36,
        gameDate: "2025-01-11",
        opponent: "東村山西",
        result: "loss",
        homeAway: "先",
        teamScore: 0,
        opponentScore: 3,
        innings: "3回",
        notes: "合同練習",
      },
      // No.37: 1/11 vs 東村山西 ○ 1-0 (3回・合同練習)
      {
        gameNumber: 37,
        gameDate: "2025-01-11",
        opponent: "東村山西",
        result: "win",
        homeAway: "後",
        teamScore: 1,
        opponentScore: 0,
        innings: "3回",
        notes: "合同練習",
      },
      // No.38: 1/11 vs 東村山西 ● 2-3 (3回・合同練習・サヨナラ)
      {
        gameNumber: 38,
        gameDate: "2025-01-11",
        opponent: "東村山西",
        result: "loss",
        homeAway: "先",
        teamScore: 2,
        opponentScore: 3,
        innings: "3回",
        notes: "合同練習・サヨナラ",
      },
    ];

    console.log("\nAdding game results...");
    for (const game of newGames) {
      // 既存データをチェック
      const [existing] = await connection.execute(
        "SELECT id FROM gameResults WHERE gameNumber = ?",
        [game.gameNumber]
      );

      if (existing.length > 0) {
        console.log(`✓ Game No.${game.gameNumber} already exists, skipping`);
      } else {
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
          `✓ Added game No.${game.gameNumber}: ${game.opponent} (${game.gameDate})`
        );
      }
    }

    console.log("\n✅ Setup complete!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
