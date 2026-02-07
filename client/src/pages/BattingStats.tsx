import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

export default function BattingStats() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.battingStats.list.useQuery();
  const { data: teamStat } = trpc.teamStats.get.useQuery();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="accent-square-lg" />
          <h1 className="text-2xl font-black tracking-tight uppercase">Batting</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-7">打者成績一覧</p>
      </div>

      <div className="swiss-divider" />

      {/* Team summary */}
      {teamStat && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black tracking-tight">{teamStat.teamBattingAvg}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">チーム打率</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black tracking-tight">{teamStat.teamSlugging}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">チーム長打率</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black tracking-tight">{teamStat.teamOps}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">チームOPS</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black tracking-tight">{teamStat.avgRunsScored}</p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">平均得点</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="main" className="w-full">
        <TabsList>
          <TabsTrigger value="main" className="text-xs font-semibold">主要成績</TabsTrigger>
          <TabsTrigger value="detail" className="text-xs font-semibold">詳細</TabsTrigger>
          <TabsTrigger value="lr" className="text-xs font-semibold">左右別</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="mt-4">
          {stats && stats.length > 0 ? (
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-2 text-left font-bold uppercase tracking-wider sticky left-0 bg-muted/30">選手</th>
                    <th className="p-2 text-center font-bold">学年</th>
                    <th className="p-2 text-center font-bold">試合</th>
                    <th className="p-2 text-center font-bold">打席</th>
                    <th className="p-2 text-center font-bold">打数</th>
                    <th className="p-2 text-center font-bold">安打</th>
                    <th className="p-2 text-center font-bold">2B</th>
                    <th className="p-2 text-center font-bold">3B</th>
                    <th className="p-2 text-center font-bold">HR</th>
                    <th className="p-2 text-center font-bold">打点</th>
                    <th className="p-2 text-center font-bold">盗塁</th>
                    <th className="p-2 text-center font-bold">打率</th>
                    <th className="p-2 text-center font-bold">出塁率</th>
                    <th className="p-2 text-center font-bold">OPS</th>
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
                          <span className="w-6 h-6 bg-foreground text-background flex items-center justify-center font-black text-[10px] shrink-0">
                            {s.uniformNumber ?? "-"}
                          </span>
                          {s.memberName}
                        </div>
                      </td>
                      <td className="p-2 text-center">{s.grade}年</td>
                      <td className="p-2 text-center">{s.games}</td>
                      <td className="p-2 text-center">{s.plateAppearances}</td>
                      <td className="p-2 text-center">{s.atBats}</td>
                      <td className="p-2 text-center">{s.hits}</td>
                      <td className="p-2 text-center">{s.doubles}</td>
                      <td className="p-2 text-center">{s.triples}</td>
                      <td className="p-2 text-center font-bold">{s.homeRuns}</td>
                      <td className="p-2 text-center">{s.rbis}</td>
                      <td className="p-2 text-center">{s.stolenBases}</td>
                      <td className="p-2 text-center font-bold text-primary">{s.battingAvg}</td>
                      <td className="p-2 text-center">{s.onBasePercentage}</td>
                      <td className="p-2 text-center font-bold">{s.ops}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">打者成績データがありません</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="detail" className="mt-4">
          {stats && stats.length > 0 ? (
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-2 text-left font-bold uppercase tracking-wider sticky left-0 bg-muted/30">選手</th>
                    <th className="p-2 text-center font-bold">得点</th>
                    <th className="p-2 text-center font-bold">単打</th>
                    <th className="p-2 text-center font-bold">塁打</th>
                    <th className="p-2 text-center font-bold">犠打</th>
                    <th className="p-2 text-center font-bold">犠飛</th>
                    <th className="p-2 text-center font-bold">四死球</th>
                    <th className="p-2 text-center font-bold">三振</th>
                    <th className="p-2 text-center font-bold">失策</th>
                    <th className="p-2 text-center font-bold">長打率</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.id} className="border-b border-border hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => setLocation(`/members/${s.memberId}`)}>
                      <td className="p-2 font-semibold sticky left-0 bg-background">{s.memberName}</td>
                      <td className="p-2 text-center">{s.runs}</td>
                      <td className="p-2 text-center">{s.singles}</td>
                      <td className="p-2 text-center">{s.totalBases}</td>
                      <td className="p-2 text-center">{s.sacrificeBunts}</td>
                      <td className="p-2 text-center">{s.sacrificeFlies}</td>
                      <td className="p-2 text-center">{s.walks}</td>
                      <td className="p-2 text-center">{s.strikeouts}</td>
                      <td className="p-2 text-center">{s.errors}</td>
                      <td className="p-2 text-center font-bold">{s.sluggingPercentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">データがありません</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="lr" className="mt-4">
          {stats && stats.length > 0 ? (
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-2 text-left font-bold uppercase tracking-wider sticky left-0 bg-muted/30">選手</th>
                    <th className="p-2 text-center font-bold" colSpan={3}>対左投手</th>
                    <th className="p-2 text-center font-bold" colSpan={3}>対右投手</th>
                  </tr>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="p-2 sticky left-0 bg-muted/20"></th>
                    <th className="p-2 text-center text-[10px] font-medium">打数</th>
                    <th className="p-2 text-center text-[10px] font-medium">安打</th>
                    <th className="p-2 text-center text-[10px] font-medium">打率</th>
                    <th className="p-2 text-center text-[10px] font-medium">打数</th>
                    <th className="p-2 text-center text-[10px] font-medium">安打</th>
                    <th className="p-2 text-center text-[10px] font-medium">打率</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.id} className="border-b border-border hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => setLocation(`/members/${s.memberId}`)}>
                      <td className="p-2 font-semibold sticky left-0 bg-background">{s.memberName}</td>
                      <td className="p-2 text-center">{s.vsLeftAtBats}</td>
                      <td className="p-2 text-center">{s.vsLeftHits}</td>
                      <td className="p-2 text-center font-bold">{s.vsLeftAvg}</td>
                      <td className="p-2 text-center">{s.vsRightAtBats}</td>
                      <td className="p-2 text-center">{s.vsRightHits}</td>
                      <td className="p-2 text-center font-bold">{s.vsRightAvg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">データがありません</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
