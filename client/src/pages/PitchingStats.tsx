import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function PitchingStats() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.pitchingStats.list.useQuery();
  const { data: teamStat } = trpc.teamStats.get.useQuery();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="accent-square-lg" />
          <h1 className="text-2xl font-black tracking-tight uppercase">Pitching</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-7">投手成績一覧</p>
      </div>

      <div className="swiss-divider" />

      {/* Team pitching summary */}
      {teamStat && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black tracking-tight">{teamStat.teamEra}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">チーム防御率</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black tracking-tight">{teamStat.teamWhip}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">チームWHIP</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black tracking-tight">{teamStat.avgRunsAllowed}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">平均失点</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pitching stats table */}
      {stats && stats.length > 0 ? (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-2 text-left font-bold uppercase tracking-wider sticky left-0 bg-muted/30">投手</th>
                <th className="p-2 text-center font-bold">学年</th>
                <th className="p-2 text-center font-bold">登板</th>
                <th className="p-2 text-center font-bold">投球回</th>
                <th className="p-2 text-center font-bold">打者</th>
                <th className="p-2 text-center font-bold">被安打</th>
                <th className="p-2 text-center font-bold">被HR</th>
                <th className="p-2 text-center font-bold">四死球</th>
                <th className="p-2 text-center font-bold">奪三振</th>
                <th className="p-2 text-center font-bold">自責点</th>
                <th className="p-2 text-center font-bold">防御率</th>
                <th className="p-2 text-center font-bold">WHIP</th>
                <th className="p-2 text-center font-bold">K%</th>
                <th className="p-2 text-center font-bold">BB%</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/members/${s.memberId}`)}
                >
                  <td className="p-2 font-semibold sticky left-0 bg-background">
                    <div className="flex items-center gap-2">
                      {s.memberName}
                    </div>
                  </td>
                  <td className="p-2 text-center">{s.grade}年</td>
                  <td className="p-2 text-center">{s.games}</td>
                  <td className="p-2 text-center">{s.inningsPitched}</td>
                  <td className="p-2 text-center">{s.battersFaced}</td>
                  <td className="p-2 text-center">{s.hitsAllowed}</td>
                  <td className="p-2 text-center">{s.homeRunsAllowed}</td>
                  <td className="p-2 text-center">{s.walks}</td>
                  <td className="p-2 text-center">{s.strikeouts}</td>
                  <td className="p-2 text-center">{s.earnedRuns}</td>
                  <td className="p-2 text-center font-bold text-primary">{s.era}</td>
                  <td className="p-2 text-center font-bold">{s.whip}</td>
                  <td className="p-2 text-center">{s.kPercentage}%</td>
                  <td className="p-2 text-center">{s.bbPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">投手成績データがありません</p>
        </div>
      )}
    </div>
  );
}
