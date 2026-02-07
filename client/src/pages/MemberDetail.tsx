import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Brain, Loader2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Streamdown } from "streamdown";

const ROLE_LABELS: Record<string, string> = {
  player: "選手",
  manager: "マネージャー",
  coach: "コーチ",
};

const PHYSICAL_LABELS: Record<string, { label: string; unit: string }> = {
  sprint_27m: { label: "27m走", unit: "秒" },
  bench_press: { label: "ベンチプレス", unit: "kg" },
  clean: { label: "クリーン", unit: "kg" },
  deadlift: { label: "デッドリフト", unit: "kg" },
};

const PHYS_COLORS: Record<string, string> = {
  sprint_27m: "#E53935",
  bench_press: "#212121",
  clean: "#757575",
  deadlift: "#D32F2F",
};

export default function MemberDetail() {
  const params = useParams<{ id: string }>();
  const memberId = Number(params.id);
  const [, setLocation] = useLocation();

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const { data: member, isLoading } = trpc.members.getById.useQuery({ id: memberId });
  const { data: battingData } = trpc.battingStats.byMember.useQuery({ memberId });
  const { data: pitchingData } = trpc.pitchingStats.byMember.useQuery({ memberId });
  const { data: physicalData } = trpc.physical.byMember.useQuery({ memberId });
  const { data: records } = trpc.records.list.useQuery({ memberId });
  const { data: summary } = trpc.records.summary.useQuery({ memberId });

  const aiMutation = trpc.records.aiAnalysis.useMutation({
    onSuccess: (data) => {
      setAiAnalysis(data.analysis as string);
      setAiDialogOpen(true);
    },
  });

  // Batting chart from game records
  const battingChartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    let cumAtBats = 0;
    let cumHits = 0;
    return records.map((r) => {
      cumAtBats += r.atBats ?? 0;
      cumHits += r.hits ?? 0;
      const avg = cumAtBats > 0 ? cumHits / cumAtBats : 0;
      return { date: r.recordDate, battingAvg: Number(avg.toFixed(3)) };
    });
  }, [records]);

  // Physical chart data
  const physicalChartData = useMemo(() => {
    if (!physicalData || physicalData.length === 0) return [];
    const dateSet = new Set<string>();
    const catMap = new Map<string, Map<string, number>>();
    for (const m of physicalData) {
      dateSet.add(m.measureDate);
      if (!catMap.has(m.category)) catMap.set(m.category, new Map());
      catMap.get(m.category)!.set(m.measureDate, Number(m.value));
    }
    const dates = Array.from(dateSet).sort();
    return dates.map((date) => {
      const point: any = { date };
      catMap.forEach((vals, cat) => {
        point[cat] = vals.get(date) ?? null;
      });
      return point;
    });
  }, [physicalData]);

  const physicalCategories = useMemo(() => {
    if (!physicalData) return [];
    return Array.from(new Set(physicalData.map((p) => p.category)));
  }, [physicalData]);

  const battingAvg = summary && Number(summary.totalAtBats) > 0
    ? (Number(summary.totalHits) / Number(summary.totalAtBats)).toFixed(3)
    : "---";
  const era = summary && Number(summary.totalInningsPitched) > 0
    ? ((Number(summary.totalEarnedRuns) * 9) / Number(summary.totalInningsPitched)).toFixed(2)
    : "---";
  const obp = summary && (Number(summary.totalAtBats) + Number(summary.totalWalks)) > 0
    ? ((Number(summary.totalHits) + Number(summary.totalWalks)) / (Number(summary.totalAtBats) + Number(summary.totalWalks))).toFixed(3)
    : "---";

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">読み込み中...</div>;
  }

  if (!member) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">部員が見つかりません</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/members")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> 部員一覧に戻る
        </Button>
      </div>
    );
  }

  const hasBatting = battingData && battingData.length > 0;
  const hasPitching = pitchingData && pitchingData.length > 0;
  const hasPhysical = physicalData && physicalData.length > 0;
  const hasRecords = records && records.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLocation("/members")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-foreground text-background flex items-center justify-center font-black text-xl shrink-0">
              {member.uniformNumber ?? "-"}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{member.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{member.grade}年</span>
                <span className="text-sm text-muted-foreground">{member.position || "未設定"}</span>
                <Badge variant="outline" className="text-[10px] font-medium">
                  {ROLE_LABELS[member.memberRole]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs font-semibold"
          onClick={() => aiMutation.mutate({ memberId })}
          disabled={aiMutation.isPending}
        >
          {aiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          AI分析
        </Button>
      </div>

      <div className="swiss-divider" />

      <Tabs defaultValue={hasBatting ? "batting" : hasRecords ? "records" : "physical"} className="w-full">
        <TabsList className="flex-wrap">
          {hasBatting && <TabsTrigger value="batting" className="text-xs font-semibold">打者成績</TabsTrigger>}
          {hasPitching && <TabsTrigger value="pitching" className="text-xs font-semibold">投手成績</TabsTrigger>}
          {hasRecords && <TabsTrigger value="records" className="text-xs font-semibold">試合記録</TabsTrigger>}
          {hasPhysical && <TabsTrigger value="physical" className="text-xs font-semibold">フィジカル</TabsTrigger>}
        </TabsList>

        {/* Batting Stats Tab */}
        {hasBatting && (
          <TabsContent value="batting" className="mt-4 space-y-4">
            {battingData.map((b) => (
              <div key={b.id}>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {[
                    { label: "打率", value: b.battingAvg, highlight: true },
                    { label: "出塁率", value: b.onBasePercentage },
                    { label: "長打率", value: b.sluggingPercentage },
                    { label: "OPS", value: b.ops, highlight: true },
                    { label: "試合", value: b.games },
                    { label: "打席", value: b.plateAppearances },
                    { label: "打数", value: b.atBats },
                    { label: "安打", value: b.hits },
                    { label: "二塁打", value: b.doubles },
                    { label: "三塁打", value: b.triples },
                    { label: "本塁打", value: b.homeRuns },
                    { label: "打点", value: b.rbis },
                    { label: "得点", value: b.runs },
                    { label: "盗塁", value: b.stolenBases },
                    { label: "四死球", value: b.walks },
                    { label: "三振", value: b.strikeouts },
                    { label: "犠打", value: b.sacrificeBunts },
                    { label: "失策", value: b.errors },
                  ].map((stat) => (
                    <Card key={stat.label} className="border border-border">
                      <CardContent className="p-2 text-center">
                        <p className={`text-lg font-black tracking-tight ${stat.highlight ? "text-primary" : ""}`}>
                          {stat.value ?? 0}
                        </p>
                        <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Left/Right split */}
                {(Number(b.vsLeftAtBats) > 0 || Number(b.vsRightAtBats) > 0) && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="accent-square" />
                      <h3 className="text-xs font-bold uppercase tracking-[0.1em]">左右別打率</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="border border-border">
                        <CardContent className="p-3 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">対左投手</p>
                          <p className="text-2xl font-black text-primary">{b.vsLeftAvg ?? "---"}</p>
                          <p className="text-[10px] text-muted-foreground">{b.vsLeftHits}/{b.vsLeftAtBats}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border">
                        <CardContent className="p-3 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">対右投手</p>
                          <p className="text-2xl font-black">{b.vsRightAvg ?? "---"}</p>
                          <p className="text-[10px] text-muted-foreground">{b.vsRightHits}/{b.vsRightAtBats}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>
        )}

        {/* Pitching Stats Tab */}
        {hasPitching && (
          <TabsContent value="pitching" className="mt-4 space-y-4">
            {pitchingData.map((p) => (
              <div key={p.id} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {[
                  { label: "防御率", value: p.era, highlight: true },
                  { label: "WHIP", value: p.whip, highlight: true },
                  { label: "登板", value: p.games },
                  { label: "投球回", value: p.inningsPitched },
                  { label: "打者", value: p.battersFaced },
                  { label: "被安打", value: p.hitsAllowed },
                  { label: "被本塁打", value: p.homeRunsAllowed },
                  { label: "四死球", value: p.walks },
                  { label: "奪三振", value: p.strikeouts },
                  { label: "自責点", value: p.earnedRuns },
                  { label: "失点", value: p.runsAllowed },
                  { label: "K%", value: p.kPercentage ? `${p.kPercentage}%` : "-" },
                  { label: "BB%", value: p.bbPercentage ? `${p.bbPercentage}%` : "-" },
                  { label: "初球S%", value: p.firstStrikePercentage ? `${p.firstStrikePercentage}%` : "-" },
                ].map((stat) => (
                  <Card key={stat.label} className="border border-border">
                    <CardContent className="p-2 text-center">
                      <p className={`text-lg font-black tracking-tight ${stat.highlight ? "text-primary" : ""}`}>
                        {stat.value ?? 0}
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </TabsContent>
        )}

        {/* Game Records Tab */}
        {hasRecords && (
          <TabsContent value="records" className="mt-4 space-y-4">
            {/* Batting avg chart */}
            {battingChartData.length > 1 && (
              <Card className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="accent-square" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.1em]">打率推移</h3>
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={battingChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, "auto"]} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #212121" }} formatter={(value: number) => [value.toFixed(3), "打率"]} />
                        <Line type="monotone" dataKey="battingAvg" stroke="#E53935" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary stats */}
            {summary && Number(summary.gamesCount) > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: "打率", value: battingAvg },
                  { label: "出塁率", value: obp },
                  { label: "防御率", value: era },
                  { label: "安打", value: summary.totalHits },
                  { label: "本塁打", value: summary.totalHomeRuns },
                  { label: "試合", value: summary.gamesCount },
                ].map((stat) => (
                  <Card key={stat.label} className="border border-border">
                    <CardContent className="p-2 text-center">
                      <p className="text-lg font-black">{stat.value}</p>
                      <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Records table */}
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-2 text-left font-bold">日付</th>
                    <th className="p-2 text-center font-bold">打数</th>
                    <th className="p-2 text-center font-bold">安打</th>
                    <th className="p-2 text-center font-bold">2B</th>
                    <th className="p-2 text-center font-bold">3B</th>
                    <th className="p-2 text-center font-bold">HR</th>
                    <th className="p-2 text-center font-bold">打点</th>
                    <th className="p-2 text-center font-bold">投球回</th>
                    <th className="p-2 text-center font-bold">自責</th>
                    <th className="p-2 text-center font-bold">K</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice().reverse().map((r) => (
                    <tr key={r.id} className="border-b border-border hover:bg-accent/30">
                      <td className="p-2 font-medium">{r.recordDate}</td>
                      <td className="p-2 text-center">{r.atBats}</td>
                      <td className="p-2 text-center">{r.hits}</td>
                      <td className="p-2 text-center">{r.doubles}</td>
                      <td className="p-2 text-center">{r.triples}</td>
                      <td className="p-2 text-center">{r.homeRuns}</td>
                      <td className="p-2 text-center">{r.rbis}</td>
                      <td className="p-2 text-center">{r.inningsPitched}</td>
                      <td className="p-2 text-center">{r.earnedRuns}</td>
                      <td className="p-2 text-center">{r.pitchStrikeouts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}

        {/* Physical Tab */}
        {hasPhysical && (
          <TabsContent value="physical" className="mt-4 space-y-4">
            {/* Physical chart */}
            {physicalChartData.length > 0 && (
              <Card className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="accent-square" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.1em]">フィジカル推移</h3>
                  </div>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={physicalChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => {
                            const d = new Date(v);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #212121" }} labelFormatter={(v) => new Date(v).toLocaleDateString("ja-JP")} />
                        <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value) => PHYSICAL_LABELS[value]?.label ?? value} />
                        {physicalCategories.map((cat) => (
                          <Line
                            key={cat}
                            type="monotone"
                            dataKey={cat}
                            stroke={PHYS_COLORS[cat] || "#212121"}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            connectNulls
                            name={cat}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Physical data table */}
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-2 text-left font-bold">日付</th>
                    <th className="p-2 text-left font-bold">種目</th>
                    <th className="p-2 text-center font-bold">記録</th>
                  </tr>
                </thead>
                <tbody>
                  {physicalData.slice().reverse().map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-accent/30">
                      <td className="p-2 font-medium">{p.measureDate}</td>
                      <td className="p-2">{PHYSICAL_LABELS[p.category]?.label ?? p.category}</td>
                      <td className="p-2 text-center font-bold">
                        {p.value}{PHYSICAL_LABELS[p.category]?.unit ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* No data fallback */}
      {!hasBatting && !hasPitching && !hasRecords && !hasPhysical && (
        <div className="p-8 border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">成績データがまだ登録されていません</p>
        </div>
      )}

      {/* AI Analysis Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI成績分析 - {member.name}
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            {aiAnalysis && <Streamdown>{aiAnalysis}</Streamdown>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
