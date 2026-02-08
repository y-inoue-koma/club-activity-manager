import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createUserContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Admin User");
    expect(result?.role).toBe("admin");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("members router - authorization", () => {
  it("admin can access members.list", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw - admin has access
    const result = await caller.members.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("regular user can access members.list", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.members.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("unauthenticated user cannot access members.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.members.list()).rejects.toThrow();
  });

  it("regular user cannot create members (admin only)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.members.create({ name: "Test", grade: "1" })
    ).rejects.toThrow();
  });
});

describe("schedules router - authorization", () => {
  it("admin can access schedules.list", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.schedules.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("regular user cannot create schedules (admin only)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.schedules.create({
        title: "Test",
        eventDate: "2026-02-10",
        startTime: "09:00",
      })
    ).rejects.toThrow();
  });
});

describe("menus router - authorization", () => {
  it("authenticated user can list menus", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.menus.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("regular user cannot create menus (admin only)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.menus.create({
        category: "batting",
        title: "Test Menu",
      })
    ).rejects.toThrow();
  });
});

describe("records router - authorization", () => {
  it("regular user cannot create records (admin only)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.records.create({
        memberId: 1,
        recordDate: "2026-02-10",
      })
    ).rejects.toThrow();
  });
});

describe("absences router - authorization", () => {
  it("authenticated user can list absences", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.absences.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("unauthenticated user cannot list absences", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.absences.list()).rejects.toThrow();
  });

  it("regular user cannot update absence status (admin only)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.absences.updateStatus({ id: 1, status: "noted" })
    ).rejects.toThrow();
  });
});

describe("reminders router - authorization", () => {
  it("regular user cannot send reminders (admin only)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.reminders.checkTomorrow()).rejects.toThrow();
  });
});

describe("battingStats router - authorization", () => {
  it("authenticated user can list batting stats", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.battingStats.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("unauthenticated user cannot list batting stats", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.battingStats.list()).rejects.toThrow();
  });

  it("authenticated user can query batting stats by member", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.battingStats.byMember({ memberId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("pitchingStats router - authorization", () => {
  it("authenticated user can list pitching stats", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pitchingStats.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("unauthenticated user cannot list pitching stats", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.pitchingStats.list()).rejects.toThrow();
  });
});

describe("velocity router - authorization", () => {
  it("authenticated user can list pitch velocity", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.velocity.pitchList();
    expect(Array.isArray(result)).toBe(true);
  });

  it("authenticated user can list exit velocity", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.velocity.exitList();
    expect(Array.isArray(result)).toBe(true);
  });

  it("authenticated user can list pulldown velocity", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.velocity.pulldownList();
    expect(Array.isArray(result)).toBe(true);
  });

  it("unauthenticated user cannot list velocity data", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.velocity.pitchList()).rejects.toThrow();
  });

  it("authenticated user can query pitch velocity by member", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.velocity.pitchByMember({ memberId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("authenticated user can query exit velocity by member", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.velocity.exitByMember({ memberId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("authenticated user can query pulldown velocity by member", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.velocity.pulldownByMember({ memberId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("unauthenticated user cannot query velocity by member", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.velocity.pitchByMember({ memberId: 1 })).rejects.toThrow();
    await expect(caller.velocity.exitByMember({ memberId: 1 })).rejects.toThrow();
    await expect(caller.velocity.pulldownByMember({ memberId: 1 })).rejects.toThrow();
  });
});

describe("physical router - authorization", () => {
  it("authenticated user can list physical data", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.physical.list({ category: "sprint_27m" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("authenticated user can query physical data by member", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.physical.byMember({ memberId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("unauthenticated user cannot list physical data", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.physical.list({ category: "sprint_27m" })).rejects.toThrow();
  });
});

describe("gameResults router - authorization", () => {
  it("authenticated user can list game results", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gameResults.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("unauthenticated user cannot list game results", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.gameResults.list()).rejects.toThrow();
  });
});

describe("teamStats router - authorization", () => {
  it("authenticated user can get team stats", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    // Should return either data or null, but not throw
    const result = await caller.teamStats.get();
    expect(result === null || result === undefined || typeof result === 'object').toBe(true);
  });

  it("unauthenticated user cannot get team stats", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.teamStats.get()).rejects.toThrow();
  });
});

describe("teamStats.monthlyTrend router - authorization", () => {
  it("authenticated user can get monthly trend", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.teamStats.monthlyTrend();
    expect(Array.isArray(result)).toBe(true);
  });

  it("unauthenticated user cannot get monthly trend", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.teamStats.monthlyTrend()).rejects.toThrow();
  });
});

describe("compare.members router - authorization", () => {
  it("authenticated user can compare members", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.compare.members({ memberIds: [1, 2] });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  it("unauthenticated user cannot compare members", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.compare.members({ memberIds: [1, 2] })).rejects.toThrow();
  });

  it("rejects less than 2 members", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.compare.members({ memberIds: [1] })).rejects.toThrow();
  });

  it("rejects more than 6 members", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.compare.members({ memberIds: [1, 2, 3, 4, 5, 6, 7] })).rejects.toThrow();
  });

  it("compare result contains expected structure", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.compare.members({ memberIds: [1, 2] });
    result.forEach((item: any) => {
      expect(item).toHaveProperty("member");
      expect(item).toHaveProperty("batting");
      expect(item).toHaveProperty("pitching");
      expect(item).toHaveProperty("physical");
      expect(item).toHaveProperty("velocity");
      expect(item).toHaveProperty("exitVelocity");
      expect(item).toHaveProperty("pulldown");
    });
  });
});

describe("input validation", () => {
  it("rejects empty title for schedule creation", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.schedules.create({
        title: "",
        eventDate: "2026-02-10",
        startTime: "09:00",
      })
    ).rejects.toThrow();
  });

  it("rejects empty title for menu creation", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.menus.create({
        category: "batting",
        title: "",
      })
    ).rejects.toThrow();
  });

  it("rejects empty name for member creation", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.members.create({
        name: "",
        grade: "1",
      })
    ).rejects.toThrow();
  });

  it("rejects invalid grade for member creation", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.members.create({
        name: "Test",
        grade: "4" as any,
      })
    ).rejects.toThrow();
  });

  it("rejects invalid event type for schedule creation", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.schedules.create({
        title: "Test",
        eventDate: "2026-02-10",
        startTime: "09:00",
        eventType: "invalid" as any,
      })
    ).rejects.toThrow();
  });

  it("rejects invalid category for menu creation", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.menus.create({
        category: "invalid" as any,
        title: "Test",
      })
    ).rejects.toThrow();
  });

  it("rejects invalid absence status", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.absences.updateStatus({
        id: 1,
        status: "invalid" as any,
      })
    ).rejects.toThrow();
  });
});
