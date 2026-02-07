import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, ClipboardList, BarChart3, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useMemo } from "react";

const EVENT_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  game: "試合",
  meeting: "ミーティング",
  other: "その他",
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

  const stats = [
    { label: "部員数", value: membersList?.length ?? 0, icon: Users, path: "/members" },
    { label: "今週の予定", value: schedules?.length ?? 0, icon: Calendar, path: "/schedules" },
    { label: "練習メニュー", value: menus?.length ?? 0, icon: ClipboardList, path: "/menus" },
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => setLocation(stat.path)}
            className="text-left group"
          >
            <Card className="border border-border hover:border-foreground transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mt-1 font-medium">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Upcoming Schedules */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="accent-square" />
          <h2 className="text-sm font-bold uppercase tracking-[0.1em]">
            今週の予定
          </h2>
        </div>
        <div className="swiss-divider-light mb-4" />
        {schedules && schedules.length > 0 ? (
          <div className="space-y-2">
            {schedules.slice(0, 5).map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center gap-4 p-4 border border-border hover:border-foreground transition-colors cursor-pointer"
                onClick={() => setLocation("/schedules")}
              >
                <div className="flex flex-col items-center justify-center w-14 shrink-0">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    {new Date(schedule.eventDate + "T00:00:00").toLocaleDateString("ja-JP", { month: "short" })}
                  </span>
                  <span className="text-2xl font-black leading-none">
                    {new Date(schedule.eventDate + "T00:00:00").getDate()}
                  </span>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {EVENT_TYPE_LABELS[schedule.eventType] || schedule.eventType}
                    </span>
                  </div>
                  <p className="font-semibold text-sm truncate">{schedule.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {schedule.startTime}{schedule.endTime ? `〜${schedule.endTime}` : ""}
                    {schedule.location ? ` ・ ${schedule.location}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-border text-center">
            <p className="text-sm text-muted-foreground">今週の予定はありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
