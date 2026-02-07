import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, ClipboardList, ArrowRight, Trophy, Swords, Activity } from "lucide-react";
import { useLocation } from "wouter";
import { useMemo } from "react";

const EVENT_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  game: "試合",
  meeting: "ミーティング",
  other: "その他",
};

const RESULT_LABELS: Record<string, string> = {
  win: "勝利",
  loss: "敗北",
  draw: "引分",
  cancelled: "中止",
};

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);
  const weekLater = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  }, []);

  const { data: schedules } = trpc.schedules.list.useQuery({ from: today, to: weekLater });
  const { data: membersList } = trpc.members.list.useQuery();
  const { data: menus } = trpc.menus.list.useQuery();
  const { data: teamStat } = trpc.teamStats.get.useQuery();
  const { data: games } = trpc.gameResults.list.useQuery();

  const recentGames = games?.slice(0, 5) ?? [];

  const quickStats = [
    { label: "部員数", value: membersList?.length ?? 0, icon: Users, path: "/members" },
    { label: "今週の予定", value: schedules?.length ?? 0, icon: Calendar, path: "/schedules" },
    { label: "練習メニュー", value: menus?.length ?? 0, icon: ClipboardList, path: "/menus" },
    { label: "総試合数", value: games?.length ?? 0, icon: Trophy, path: "/games" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="accent-square-lg" />
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Dashboard
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-7">
            {user?.name ? `${user.name}さん、` : ""}ようこそ。部活動の最新情報を確認できます。
          </p>
        </div>
      </div>

      <div className="swiss-divider" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickStats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => setLocation(stat.path)}
            className="text-left group"
          >
            <Card className="border border-border hover:border-foreground transition-colors h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1 font-medium">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Team Stats Summary */}
      {teamStat && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="accent-square" />
            <h2 className="text-sm font-bold uppercase tracking-[0.1em]">チーム成績</h2>
          </div>
          <div className="swiss-divider-light mb-3" />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: "打率", value: teamStat.teamBattingAvg, icon: Swords },
              { label: "OPS", value: teamStat.teamOps, icon: Swords },
              { label: "防御率", value: teamStat.teamEra, icon: Activity },
              { label: "WHIP", value: teamStat.teamWhip, icon: Activity },
              { label: "平均得点", value: teamStat.avgRunsScored, icon: Trophy },
              { label: "勝率", value: teamStat.winRate ? `${(Number(teamStat.winRate) * 100).toFixed(0)}%` : "-", icon: Trophy },
            ].map((item) => (
              <Card key={item.label} className="border border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-black tracking-tight">{item.value ?? "-"}</p>
                  <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium mt-0.5">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Schedules */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="accent-square" />
              <h2 className="text-sm font-bold uppercase tracking-[0.1em]">今週の予定</h2>
            </div>
            <button
              onClick={() => setLocation("/schedules")}
              className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              すべて見る →
            </button>
          </div>
          <div className="swiss-divider-light mb-3" />
          {schedules && schedules.length > 0 ? (
            <div className="space-y-2">
              {schedules.slice(0, 5).map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center gap-4 p-3 border border-border hover:border-foreground transition-colors cursor-pointer"
                  onClick={() => setLocation("/schedules")}
                >
                  <div className="flex flex-col items-center justify-center w-12 shrink-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      {new Date(schedule.eventDate + "T00:00:00").toLocaleDateString("ja-JP", { month: "short" })}
                    </span>
                    <span className="text-xl font-black leading-none">
                      {new Date(schedule.eventDate + "T00:00:00").getDate()}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {EVENT_TYPE_LABELS[schedule.eventType] || schedule.eventType}
                      </span>
                    </div>
                    <p className="font-semibold text-sm truncate">{schedule.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {schedule.startTime}{schedule.endTime ? `〜${schedule.endTime}` : ""}
                      {schedule.location ? ` ・ ${schedule.location}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">今週の予定はありません</p>
            </div>
          )}
        </div>

        {/* Recent Games */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="accent-square" />
              <h2 className="text-sm font-bold uppercase tracking-[0.1em]">最近の試合</h2>
            </div>
            <button
              onClick={() => setLocation("/games")}
              className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              すべて見る →
            </button>
          </div>
          <div className="swiss-divider-light mb-3" />
          {recentGames.length > 0 ? (
            <div className="space-y-2">
              {recentGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center gap-4 p-3 border border-border hover:border-foreground transition-colors cursor-pointer"
                  onClick={() => setLocation("/games")}
                >
                  <div className="flex flex-col items-center justify-center w-12 shrink-0">
                    <span className={`text-xl font-black leading-none ${game.result === "win" ? "text-primary" : ""}`}>
                      {game.teamScore ?? "-"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">vs</span>
                    <span className="text-xl font-black leading-none">
                      {game.opponentScore ?? "-"}
                    </span>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${game.result === "win" ? "text-primary" : "text-muted-foreground"}`}>
                        {RESULT_LABELS[game.result]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{game.gameDate}</span>
                    </div>
                    <p className="font-semibold text-sm truncate">vs {game.opponent}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">試合結果がありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
