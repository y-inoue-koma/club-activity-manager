import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Members ──
  members: router({
    list: protectedProcedure
      .input(z.object({ activeOnly: z.boolean().optional().default(true) }).optional())
      .query(async ({ input }) => {
        return db.listMembers(input?.activeOnly ?? true);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMemberById(input.id);
      }),
    getMyProfile: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getMemberByUserId(ctx.user.id);
      }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        grade: z.enum(["1", "2", "3"]),
        position: z.string().optional(),
        uniformNumber: z.number().optional(),
        memberRole: z.enum(["player", "manager", "coach"]).optional(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createMember(input);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        grade: z.enum(["1", "2", "3"]).optional(),
        position: z.string().optional(),
        uniformNumber: z.number().optional(),
        memberRole: z.enum(["player", "manager", "coach"]).optional(),
        isActive: z.number().optional(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMember(id, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMember(input.id);
        return { success: true };
      }),
  }),

  // ── Schedules ──
  schedules: router({
    list: protectedProcedure
      .input(z.object({ from: z.string().optional(), to: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.listSchedules(input?.from, input?.to);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getScheduleById(input.id);
      }),
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        eventType: z.enum(["practice", "game", "meeting", "other"]).optional(),
        eventDate: z.string(),
        startTime: z.string(),
        endTime: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createSchedule({ ...input, createdBy: ctx.user.id });
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        eventType: z.enum(["practice", "game", "meeting", "other"]).optional(),
        eventDate: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSchedule(id, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSchedule(input.id);
        return { success: true };
      }),
  }),

  // ── Practice Menus ──
  menus: router({
    list: protectedProcedure
      .input(z.object({ scheduleId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.listPracticeMenus(input?.scheduleId);
      }),
    create: adminProcedure
      .input(z.object({
        scheduleId: z.number().optional(),
        category: z.enum(["batting", "fielding", "pitching", "running", "conditioning", "other"]),
        title: z.string().min(1),
        description: z.string().optional(),
        duration: z.number().optional(),
        targetGroup: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createPracticeMenu(input);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        scheduleId: z.number().optional(),
        category: z.enum(["batting", "fielding", "pitching", "running", "conditioning", "other"]).optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        duration: z.number().optional(),
        targetGroup: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePracticeMenu(id, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePracticeMenu(input.id);
        return { success: true };
      }),
  }),

  // ── Player Records ──
  records: router({
    list: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        from: z.string().optional(),
        to: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.listPlayerRecords(input.memberId, input.from, input.to);
      }),
    summary: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
        return db.getPlayerRecordsSummary(input.memberId);
      }),
    create: adminProcedure
      .input(z.object({
        memberId: z.number(),
        recordDate: z.string(),
        atBats: z.number().optional(),
        hits: z.number().optional(),
        doubles: z.number().optional(),
        triples: z.number().optional(),
        homeRuns: z.number().optional(),
        rbis: z.number().optional(),
        runs: z.number().optional(),
        strikeouts: z.number().optional(),
        walks: z.number().optional(),
        stolenBases: z.number().optional(),
        inningsPitched: z.string().optional(),
        earnedRuns: z.number().optional(),
        pitchStrikeouts: z.number().optional(),
        pitchWalks: z.number().optional(),
        hitsAllowed: z.number().optional(),
        wins: z.number().optional(),
        losses: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createPlayerRecord(input);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        recordDate: z.string().optional(),
        atBats: z.number().optional(),
        hits: z.number().optional(),
        doubles: z.number().optional(),
        triples: z.number().optional(),
        homeRuns: z.number().optional(),
        rbis: z.number().optional(),
        runs: z.number().optional(),
        strikeouts: z.number().optional(),
        walks: z.number().optional(),
        stolenBases: z.number().optional(),
        inningsPitched: z.string().optional(),
        earnedRuns: z.number().optional(),
        pitchStrikeouts: z.number().optional(),
        pitchWalks: z.number().optional(),
        hitsAllowed: z.number().optional(),
        wins: z.number().optional(),
        losses: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePlayerRecord(id, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePlayerRecord(input.id);
        return { success: true };
      }),
    // AI成績分析
    aiAnalysis: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .mutation(async ({ input }) => {
        const member = await db.getMemberById(input.memberId);
        if (!member) throw new Error("Member not found");
        const summary = await db.getPlayerRecordsSummary(input.memberId);
        const records = await db.listPlayerRecords(input.memberId);
        if (!summary || records.length === 0) {
          return { analysis: "成績データがまだ登録されていません。データを登録してからAI分析をお試しください。" };
        }
        const battingAvg = summary.totalAtBats > 0 ? (Number(summary.totalHits) / Number(summary.totalAtBats)).toFixed(3) : "N/A";
        const era = Number(summary.totalInningsPitched) > 0 ? ((Number(summary.totalEarnedRuns) * 9) / Number(summary.totalInningsPitched)).toFixed(2) : "N/A";
        const prompt = `あなたは高校野球の指導者AIです。以下の選手データを分析し、具体的な改善提案とトレーニングアドバイスを日本語で提供してください。

選手情報:
- 名前: ${member.name}
- 学年: ${member.grade}年
- ポジション: ${member.position || "未設定"}
- 背番号: ${member.uniformNumber || "未設定"}

通算成績 (${summary.gamesCount}試合):
【打撃】打率: ${battingAvg} | 打数: ${summary.totalAtBats} | 安打: ${summary.totalHits} | 二塁打: ${summary.totalDoubles} | 三塁打: ${summary.totalTriples} | 本塁打: ${summary.totalHomeRuns} | 打点: ${summary.totalRbis} | 得点: ${summary.totalRuns} | 三振: ${summary.totalStrikeouts} | 四球: ${summary.totalWalks} | 盗塁: ${summary.totalStolenBases}
【投手】投球回: ${summary.totalInningsPitched} | 防御率: ${era} | 奪三振: ${summary.totalPitchStrikeouts} | 与四球: ${summary.totalPitchWalks} | 被安打: ${summary.totalHitsAllowed} | 勝: ${summary.totalWins} | 敗: ${summary.totalLosses}

以下の観点で分析してください:
1. 現在の強みと課題
2. 打撃フォームや守備位置の改善提案
3. 具体的なトレーニングメニュー提案
4. 今後の目標設定のアドバイス`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "あなたは高校野球の経験豊富な指導者です。データに基づいた具体的で実践的なアドバイスを提供してください。" },
            { role: "user", content: prompt },
          ],
        });
        const analysis = response.choices?.[0]?.message?.content || "分析結果を取得できませんでした。";
        return { analysis };
      }),
  }),

  // ── Absences ──
  absences: router({
    list: protectedProcedure
      .input(z.object({
        scheduleId: z.number().optional(),
        memberId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listAbsences(input?.scheduleId, input?.memberId);
      }),
    create: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        scheduleId: z.number().optional(),
        absenceDate: z.string(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createAbsence(input);
        // 管理者に通知
        const member = await db.getMemberById(input.memberId);
        const memberName = member?.name || "不明";
        await notifyOwner({
          title: `欠席連絡: ${memberName}`,
          content: `${memberName}が${input.absenceDate}の活動を欠席します。\n理由: ${input.reason || "未記入"}`,
        }).catch(() => {});
        return result;
      }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "noted"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateAbsenceStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ── Reminder (check upcoming events) ──
  reminders: router({
    checkTomorrow: adminProcedure
      .mutation(async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split("T")[0];
        const upcoming = await db.getSchedulesForDate(dateStr);
        if (upcoming.length === 0) return { sent: false, message: "明日の予定はありません。" };
        const eventList = upcoming.map(s =>
          `・${s.title} (${s.startTime}${s.endTime ? "〜" + s.endTime : ""}) @ ${s.location || "未定"}`
        ).join("\n");
        await notifyOwner({
          title: `【リマインダー】明日の予定 (${dateStr})`,
          content: `明日の予定:\n${eventList}`,
        });
        return { sent: true, message: `${upcoming.length}件の予定のリマインダーを送信しました。` };
      }),
  }),
});

export type AppRouter = typeof appRouter;
