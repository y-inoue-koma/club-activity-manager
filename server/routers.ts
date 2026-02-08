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
      .query(async ({ input }) => db.listMembers(input?.activeOnly ?? true)),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getMemberById(input.id)),
    getMyProfile: protectedProcedure
      .query(async ({ ctx }) => db.getMemberByUserId(ctx.user.id)),
    fullDetail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getMemberFullDetail(input.id)),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        grade: z.enum(["1", "2", "3"]),
        position: z.string().optional(),
        uniformNumber: z.number().optional(),
        classNumber: z.string().optional(),
        studentNumber: z.number().optional(),
        kana: z.string().optional(),
        memberRole: z.enum(["player", "manager", "coach"]).optional(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input }) => db.createMember(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        grade: z.enum(["1", "2", "3"]).optional(),
        position: z.string().optional(),
        uniformNumber: z.number().optional(),
        classNumber: z.string().optional(),
        studentNumber: z.number().optional(),
        kana: z.string().optional(),
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
      .query(async ({ input }) => db.listSchedules(input?.from, input?.to)),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getScheduleById(input.id)),
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        eventType: z.enum(["practice", "game", "meeting", "other"]).optional(),
        eventDate: z.string(),
        startTime: z.string(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        uniform: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => db.createSchedule({ ...input, createdBy: ctx.user.id })),
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
        uniform: z.string().optional(),
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
      .query(async ({ input }) => db.listPracticeMenus(input?.scheduleId)),
    create: adminProcedure
      .input(z.object({
        scheduleId: z.number().optional(),
        category: z.enum(["batting", "fielding", "pitching", "running", "conditioning", "other"]),
        title: z.string().min(1),
        description: z.string().optional(),
        duration: z.number().optional(),
        targetGroup: z.string().optional(),
      }))
      .mutation(async ({ input }) => db.createPracticeMenu(input)),
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
      .input(z.object({ memberId: z.number(), from: z.string().optional(), to: z.string().optional() }))
      .query(async ({ input }) => db.listPlayerRecords(input.memberId, input.from, input.to)),
    summary: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => db.getPlayerRecordsSummary(input.memberId)),
    create: adminProcedure
      .input(z.object({
        memberId: z.number(), recordDate: z.string(),
        atBats: z.number().optional(), hits: z.number().optional(),
        doubles: z.number().optional(), triples: z.number().optional(),
        homeRuns: z.number().optional(), rbis: z.number().optional(),
        runs: z.number().optional(), strikeouts: z.number().optional(),
        walks: z.number().optional(), stolenBases: z.number().optional(),
        inningsPitched: z.string().optional(), earnedRuns: z.number().optional(),
        pitchStrikeouts: z.number().optional(), pitchWalks: z.number().optional(),
        hitsAllowed: z.number().optional(), wins: z.number().optional(),
        losses: z.number().optional(), notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => db.createPlayerRecord(input)),
    update: adminProcedure
      .input(z.object({
        id: z.number(), recordDate: z.string().optional(),
        atBats: z.number().optional(), hits: z.number().optional(),
        doubles: z.number().optional(), triples: z.number().optional(),
        homeRuns: z.number().optional(), rbis: z.number().optional(),
        runs: z.number().optional(), strikeouts: z.number().optional(),
        walks: z.number().optional(), stolenBases: z.number().optional(),
        inningsPitched: z.string().optional(), earnedRuns: z.number().optional(),
        pitchStrikeouts: z.number().optional(), pitchWalks: z.number().optional(),
        hitsAllowed: z.number().optional(), wins: z.number().optional(),
        losses: z.number().optional(), notes: z.string().optional(),
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
        const detail = await db.getMemberFullDetail(input.memberId);
        if (!detail.member) throw new Error("Member not found");
        const m = detail.member;
        const bat = detail.batting[0];
        const pit = detail.pitching[0];
        const vel = detail.velocity[0];
        const ev = detail.exitVelocity[0];
        const pd = detail.pulldown[0];

        let statsText = `選手: ${m.name} (${m.grade}年)\nポジション: ${m.position || "未設定"}\n`;
        if (bat) {
          statsText += `\n【打撃成績】${bat.games}試合 | 打率: ${bat.battingAvg} | OPS: ${bat.ops} | 出塁率: ${bat.onBasePercentage} | 長打率: ${bat.sluggingPercentage}\n打数: ${bat.atBats} | 安打: ${bat.hits} | 二塁打: ${bat.doubles} | 三塁打: ${bat.triples} | 本塁打: ${bat.homeRuns} | 打点: ${bat.rbis} | 盗塁: ${bat.stolenBases} | 三振: ${bat.strikeouts} | 四死球: ${bat.walks}\n対左打率: ${bat.vsLeftAvg} | 対右打率: ${bat.vsRightAvg}`;
        }
        if (pit) {
          statsText += `\n\n【投手成績】${pit.games}試合 | 防御率: ${pit.era} | WHIP: ${pit.whip} | 投球回: ${pit.inningsPitched}\n奪三振: ${pit.strikeouts} | 四死球: ${pit.walks} | 被安打: ${pit.hitsAllowed} | 自責点: ${pit.earnedRuns}\nK%: ${pit.kPercentage} | BB%: ${pit.bbPercentage}`;
        }
        if (vel) {
          statsText += `\n\n【球速】ストレート平均: ${vel.avgFastball}km/h | 変化球平均: ${vel.avgBreaking}km/h`;
        }
        if (ev) {
          statsText += `\n\n【打球速度】平均: ${ev.avgSpeed}km/h | 最大: ${ev.maxSpeed}km/h (ランク: ${ev.avgRank}位)`;
        }
        if (pd) {
          statsText += `\n\n【プルダウン球速】平均: ${pd.avgSpeed}km/h | 最大: ${pd.maxSpeed}km/h (ランク: ${pd.avgRank}位)`;
        }
        const physCategories = { sprint_27m: "27m走", bench_press: "ベンチプレス", clean: "クリーン", deadlift: "デッドリフト" };
        if (detail.physical.length > 0) {
          statsText += "\n\n【フィジカル測定】";
          for (const [cat, label] of Object.entries(physCategories)) {
            const recs = detail.physical.filter(p => p.category === cat);
            if (recs.length > 0) {
              const latest = recs[recs.length - 1];
              statsText += `\n${label}: ${latest.value} (${latest.measureDate})`;
              if (recs.length > 1) {
                statsText += ` [推移: ${recs.map(r => `${r.value}(${r.measureDate})`).join(" → ")}]`;
              }
            }
          }
        }

        if (!bat && !pit) {
          return { analysis: "成績データがまだ登録されていません。データを登録してからAI分析をお試しください。" };
        }

        const prompt = `あなたは高校野球の指導者AIです。以下の選手データを分析し、具体的な改善提案とトレーニングアドバイスを日本語で提供してください。\n\n${statsText}\n\n以下の観点で分析してください:\n1. 現在の強みと課題\n2. 打撃フォームや守備位置の改善提案\n3. 具体的なトレーニングメニュー提案\n4. フィジカルデータに基づく身体能力の改善点\n5. 今後の目標設定のアドバイス`;

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

  // ── Batting Stats ──
  battingStats: router({
    list: protectedProcedure.query(async () => db.listAllBattingStats()),
    byMember: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => db.getBattingStatsByMember(input.memberId)),
  }),

  // ── Pitching Stats ──
  pitchingStats: router({
    list: protectedProcedure.query(async () => db.listAllPitchingStats()),
    byMember: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => db.getPitchingStatsByMember(input.memberId)),
  }),

  // ── Velocity Data ──
  velocity: router({
    pitchList: protectedProcedure.query(async () => db.listAllPitchVelocity()),
    exitList: protectedProcedure.query(async () => db.listAllExitVelocity()),
    pulldownList: protectedProcedure.query(async () => db.listAllPulldownVelocity()),
    pitchByMember: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => db.getPitchVelocityByMember(input.memberId)),
    exitByMember: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => db.getExitVelocityByMember(input.memberId)),
    pulldownByMember: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => db.getPulldownVelocityByMember(input.memberId)),
  }),

  // ── Physical Measurements ──
  physical: router({
    list: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => db.listAllPhysical(input.category)),
    byMember: protectedProcedure
      .input(z.object({ memberId: z.number(), category: z.string().optional() }))
      .query(async ({ input }) => db.getPhysicalByMember(input.memberId, input.category)),
  }),

  // ── Game Results ──
  gameResults: router({
    list: protectedProcedure.query(async () => db.listGameResults()),
  }),

  // ── Team Stats ──
  teamStats: router({
    get: protectedProcedure.query(async () => db.getTeamStats()),
    monthlyTrend: protectedProcedure.query(async () => db.getMonthlyTeamTrend()),
  }),

  // ── Compare Members ──
  compare: router({
    members: protectedProcedure
      .input(z.object({ memberIds: z.array(z.number()).min(2).max(6) }))
      .query(async ({ input }) => db.compareMembersData(input.memberIds)),
  }),

  // ── Absences ──
  absences: router({
    list: protectedProcedure
      .input(z.object({ scheduleId: z.number().optional(), memberId: z.number().optional() }).optional())
      .query(async ({ input }) => db.listAbsences(input?.scheduleId, input?.memberId)),
    create: protectedProcedure
      .input(z.object({
        memberId: z.number(), scheduleId: z.number().optional(),
        absenceDate: z.string(), reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createAbsence(input);
        const member = await db.getMemberById(input.memberId);
        await notifyOwner({
          title: `欠席連絡: ${member?.name || "不明"}`,
          content: `${member?.name || "不明"}が${input.absenceDate}の活動を欠席します。\n理由: ${input.reason || "未記入"}`,
        }).catch(() => {});
        return result;
      }),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "noted"]) }))
      .mutation(async ({ input }) => {
        await db.updateAbsenceStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ── Reminder ──
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
