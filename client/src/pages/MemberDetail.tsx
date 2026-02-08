import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Brain, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar,
} from "recharts";
import { Streamdown } from "streamdown";

const ROLE_LABELS: Record<string, string> = {
  player: "選手", manager: "マネージャー", coach: "コーチ",
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

// 高校野球部平均フィジカルデータ（調査結果に基づく）
const HS_AVERAGE_PHYSICAL: Record<string, number> = {
  sprint_27m: 4.0,       // 秒（低いほど良い）
  bench_press: 800,      // トータルボリューム kg
  clean: 1000,           // トータルボリューム kg
  deadlift: 1500,        // トータルボリューム kg
};

function StatCard({ label, value, highlight, small }: { label: string; value: string | number | null | undefined; highlight?: boolean; small?: boolean }) {
  return (
    <Card className="border border-border">
      <CardContent className={small ? "p-1.5 text-center" : "p-2 text-center"}>
        <p className={`${small ? "text-sm" : "text-lg"} font-black tracking-tight ${highlight ? "text-primary" : ""}`}>
          {value ?? "-"}
        </p>
        <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="accent-square" />
      <h3 className="text-xs font-bold uppercase tracking-[0.1em]">{title}</h3>
    </div>
  );
}

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
  const { data: velocityData } = trpc.velocity.pitchByMember.useQuery({ memberId });
  const { data: exitVelData } = trpc.velocity.exitByMember.useQuery({ memberId });
  const { data: pulldownData } = trpc.velocity.pulldownByMember.useQuery({ memberId });
  const { data: records } = trpc.records.list.useQuery({ memberId });

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

  // Physical chart data (time series)
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

  // Radar chart data: compare player's latest physical to HS average
  const radarData = useMemo(() => {
    if (!physicalData || physicalData.length === 0) return [];
    // Get latest value per category
    const latestMap = new Map<string, number>();
    for (const p of physicalData) {
      latestMap.set(p.category, Number(p.value));
    }

    const categories = ["sprint_27m", "bench_press", "clean", "deadlift"];
    return categories
      .filter(cat => latestMap.has(cat))
      .map(cat => {
        const playerVal = latestMap.get(cat) ?? 0;
        const avgVal = HS_AVERAGE_PHYSICAL[cat];
        // Normalize to percentage (100 = average)
        // For sprint, lower is better, so invert
        let playerScore: number;
        let avgScore = 100;
        if (cat === "sprint_27m") {
          playerScore = playerVal > 0 ? Math.round((avgVal / playerVal) * 100) : 0;
        } else {
          playerScore = avgVal > 0 ? Math.round((playerVal / avgVal) * 100) : 0;
        }
        return {
          category: PHYSICAL_LABELS[cat]?.label ?? cat,
          player: playerScore,
          average: avgScore,
          playerRaw: playerVal,
          avgRaw: avgVal,
          unit: PHYSICAL_LABELS[cat]?.unit ?? "",
        };
      });
  }, [physicalData]);

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
  const hasVelocity = velocityData && velocityData.length > 0;
  const hasExitVel = exitVelData && exitVelData.length > 0;
  const hasPulldown = pulldownData && pulldownData.length > 0;

  const bat = hasBatting ? battingData[0] : null;
  const pit = hasPitching ? pitchingData[0] : null;
  const vel = hasVelocity ? velocityData[0] : null;
  const ev = hasExitVel ? exitVelData[0] : null;
  const pd = hasPulldown ? pulldownData[0] : null;

  // Determine default tab
  let defaultTab = "overview";
  if (!hasBatting && !hasPitching && !hasPhysical && !hasVelocity && !hasExitVel && !hasPulldown) {
    defaultTab = hasRecords ? "records" : "overview";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLocation("/members")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center font-black text-2xl shrink-0">
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

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="text-xs font-semibold">総合</TabsTrigger>
          {hasBatting && <TabsTrigger value="batting" className="text-xs font-semibold">打撃詳細</TabsTrigger>}
          {hasPitching && <TabsTrigger value="pitching" className="text-xs font-semibold">投手詳細</TabsTrigger>}
          {(hasVelocity || hasExitVel || hasPulldown) && <TabsTrigger value="velocity" className="text-xs font-semibold">球速・打球速度</TabsTrigger>}
          {hasPhysical && <TabsTrigger value="physical" className="text-xs font-semibold">フィジカル</TabsTrigger>}
          {hasRecords && <TabsTrigger value="records" className="text-xs font-semibold">試合記録</TabsTrigger>}
        </TabsList>

        {/* ===== Overview Tab ===== */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* Key Stats Summary */}
          <div>
            <SectionHeader title="主要指標サマリー" />
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {bat && (
                <>
                  <StatCard label="打率" value={bat.battingAvg} highlight />
                  <StatCard label="OPS" value={bat.ops} highlight />
                  <StatCard label="出塁率" value={bat.onBasePercentage} />
                  <StatCard label="長打率" value={bat.sluggingPercentage} />
                  <StatCard label="安打" value={bat.hits} />
                  <StatCard label="本塁打" value={bat.homeRuns} />
                  <StatCard label="打点" value={bat.rbis} />
                  <StatCard label="盗塁" value={bat.stolenBases} />
                </>
              )}
            </div>
            {pit && (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-2">
                <StatCard label="防御率" value={pit.era} highlight />
                <StatCard label="WHIP" value={pit.whip} highlight />
                <StatCard label="投球回" value={pit.inningsPitched} />
                <StatCard label="奪三振" value={pit.strikeouts} />
                <StatCard label="K%" value={pit.kPercentage ? `${pit.kPercentage}%` : "-"} />
                <StatCard label="BB%" value={pit.bbPercentage ? `${pit.bbPercentage}%` : "-"} />
                <StatCard label="自責点" value={pit.earnedRuns} />
                <StatCard label="初球S%" value={pit.firstStrikePercentage ? `${pit.firstStrikePercentage}%` : "-"} />
              </div>
            )}
          </div>

          {/* Velocity Summary */}
          {(hasVelocity || hasExitVel || hasPulldown) && (
            <div>
              <SectionHeader title="球速・打球速度" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {vel && (
                  <>
                    <StatCard label="ストレート平均" value={`${vel.avgFastball}km`} highlight />
                    <StatCard label="ストレートMAX" value={`${vel.maxFastball}km`} />
                    <StatCard label="変化球平均" value={`${vel.avgBreaking}km`} />
                  </>
                )}
                {ev && (
                  <>
                    <StatCard label="打球速度平均" value={`${ev.avgSpeed}km`} highlight />
                    <StatCard label="打球速度MAX" value={`${ev.maxSpeed}km`} />
                  </>
                )}
                {pd && (
                  <StatCard label="プルダウンMAX" value={`${pd.maxSpeed}km`} />
                )}
              </div>
            </div>
          )}

          {/* Left/Right Split */}
          {bat && (Number(bat.vsLeftAtBats) > 0 || Number(bat.vsRightAtBats) > 0) && (
            <div>
              <SectionHeader title="左右別打率" />
              <div className="grid grid-cols-3 gap-3">
                <Card className="border border-border">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">総合</p>
                    <p className="text-2xl font-black text-primary">{bat.battingAvg}</p>
                    <p className="text-[10px] text-muted-foreground">{bat.hits}/{bat.atBats}</p>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">対左投手</p>
                    <p className="text-2xl font-black">{bat.vsLeftAvg ?? "---"}</p>
                    <p className="text-[10px] text-muted-foreground">{bat.vsLeftHits}/{bat.vsLeftAtBats}</p>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">対右投手</p>
                    <p className="text-2xl font-black">{bat.vsRightAvg ?? "---"}</p>
                    <p className="text-[10px] text-muted-foreground">{bat.vsRightHits}/{bat.vsRightAtBats}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Radar Chart */}
          {radarData.length > 0 && (
            <div>
              <SectionHeader title="フィジカル レーダーチャート（高校野球部平均=100）" />
              <Card className="border border-border">
                <CardContent className="p-4">
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e5e5e5" />
                        <PolarAngleAxis
                          dataKey="category"
                          tick={{ fontSize: 11, fontWeight: 700, fill: "#212121" }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 200]}
                          tick={{ fontSize: 9, fill: "#999" }}
                          tickCount={5}
                        />
                        <Radar
                          name="高校平均"
                          dataKey="average"
                          stroke="#999"
                          fill="#e5e5e5"
                          fillOpacity={0.3}
                          strokeWidth={1}
                          strokeDasharray="4 4"
                        />
                        <Radar
                          name={member.name}
                          dataKey="player"
                          stroke="#E53935"
                          fill="#E53935"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 11, border: "1px solid #212121" }}
                          formatter={(value: number, name: string, props: any) => {
                            const item = props.payload;
                            if (name === member.name) {
                              return [`${value}% (${item.playerRaw}${item.unit})`, name];
                            }
                            return [`${value}% (${item.avgRaw}${item.unit})`, "高校平均"];
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground text-center">
                    ※ 100 = 高校野球部平均値。27m走は速いほど高スコア。ウェイトはトータルボリューム基準。
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* No data fallback */}
          {!hasBatting && !hasPitching && !hasPhysical && !hasVelocity && !hasExitVel && !hasPulldown && !hasRecords && (
            <div className="p-8 border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">成績データがまだ登録されていません</p>
            </div>
          )}
        </TabsContent>

        {/* ===== Batting Detail Tab ===== */}
        {hasBatting && (
          <TabsContent value="batting" className="mt-4 space-y-6">
            {battingData.map((b) => (
              <div key={b.id} className="space-y-4">
                <SectionHeader title={`打撃成績 (${b.period})`} />
                {/* Core stats */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {[
                    { label: "打率", value: b.battingAvg, highlight: true },
                    { label: "出塁率", value: b.onBasePercentage },
                    { label: "長打率", value: b.sluggingPercentage },
                    { label: "OPS", value: b.ops, highlight: true },
                    { label: "試合", value: b.games },
                    { label: "打席", value: b.plateAppearances },
                    { label: "打数", value: b.atBats },
                    { label: "得点", value: b.runs },
                    { label: "安打", value: b.hits },
                    { label: "単打", value: b.singles },
                    { label: "二塁打", value: b.doubles },
                    { label: "三塁打", value: b.triples },
                    { label: "本塁打", value: b.homeRuns },
                    { label: "塁打数", value: b.totalBases },
                    { label: "打点", value: b.rbis },
                    { label: "盗塁", value: b.stolenBases },
                    { label: "盗塁企画", value: b.stolenBasesTotal },
                    { label: "犠打", value: b.sacrificeBunts },
                    { label: "犠飛", value: b.sacrificeFlies },
                    { label: "四死球", value: b.walks },
                    { label: "三振", value: b.strikeouts },
                    { label: "BB/K", value: b.walks && b.strikeouts ? (Number(b.walks) / Math.max(Number(b.strikeouts), 1)).toFixed(2) : "-" },
                    { label: "失策", value: b.errors },
                  ].map((stat) => (
                    <StatCard key={stat.label} label={stat.label} value={stat.value ?? 0} highlight={stat.highlight} />
                  ))}
                </div>

                {/* Left/Right Split */}
                {(Number(b.vsLeftAtBats) > 0 || Number(b.vsRightAtBats) > 0) && (
                  <div>
                    <SectionHeader title="左右別打率" />
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="border border-border">
                        <CardContent className="p-3 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">対左投手</p>
                          <p className="text-3xl font-black text-primary">{b.vsLeftAvg ?? "---"}</p>
                          <p className="text-xs text-muted-foreground mt-1">{b.vsLeftHits}安打 / {b.vsLeftAtBats}打数</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border">
                        <CardContent className="p-3 text-center">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">対右投手</p>
                          <p className="text-3xl font-black">{b.vsRightAvg ?? "---"}</p>
                          <p className="text-xs text-muted-foreground mt-1">{b.vsRightHits}安打 / {b.vsRightAtBats}打数</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Batting avg chart from game records */}
                {battingChartData.length > 1 && (
                  <Card className="border border-border">
                    <CardContent className="p-4">
                      <SectionHeader title="通算打率推移" />
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
              </div>
            ))}
          </TabsContent>
        )}

        {/* ===== Pitching Detail Tab ===== */}
        {hasPitching && (
          <TabsContent value="pitching" className="mt-4 space-y-6">
            {pitchingData.map((p) => (
              <div key={p.id} className="space-y-4">
                <SectionHeader title={`投手成績 (${p.period})`} />
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {[
                    { label: "防御率", value: p.era, highlight: true },
                    { label: "WHIP", value: p.whip, highlight: true },
                    { label: "奪三振率", value: p.strikeoutRate },
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
                    { label: "K/BB", value: p.strikeouts && p.walks ? (Number(p.strikeouts) / Math.max(Number(p.walks), 1)).toFixed(2) : "-" },
                    { label: "初球S%", value: p.firstStrikePercentage ? `${p.firstStrikePercentage}%` : "-" },
                  ].map((stat) => (
                    <StatCard key={stat.label} label={stat.label} value={stat.value ?? 0} highlight={stat.highlight} />
                  ))}
                </div>

                {/* Velocity bar chart for this pitcher */}
                {vel && (
                  <div>
                    <SectionHeader title="球速データ" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <StatCard label="ストレート平均" value={`${vel.avgFastball}km`} highlight />
                      <StatCard label="ストレートMAX" value={`${vel.maxFastball}km`} />
                      <StatCard label="変化球平均" value={`${vel.avgBreaking}km`} />
                      <StatCard label="変化球MAX" value={`${vel.maxBreaking}km`} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>
        )}

        {/* ===== Velocity Tab ===== */}
        {(hasVelocity || hasExitVel || hasPulldown) && (
          <TabsContent value="velocity" className="mt-4 space-y-6">
            {/* Pitch Velocity */}
            {vel && (
              <div>
                <SectionHeader title="投手球速" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatCard label="ストレート平均" value={`${vel.avgFastball}km`} highlight />
                  <StatCard label="ストレートMAX" value={`${vel.maxFastball}km`} highlight />
                  <StatCard label="変化球平均" value={`${vel.avgBreaking}km`} />
                  <StatCard label="変化球MAX" value={`${vel.maxBreaking}km`} />
                </div>
                <Card className="border border-border mt-3">
                  <CardContent className="p-4">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: "ストレート", avg: vel.avgFastball, max: vel.maxFastball },
                          { name: "変化球", avg: vel.avgBreaking, max: vel.maxBreaking },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                          <YAxis domain={[60, "auto"]} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #212121" }} />
                          <Bar dataKey="avg" name="平均" fill="#E53935" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="max" name="MAX" fill="#212121" radius={[2, 2, 0, 0]} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Exit Velocity */}
            {ev && (
              <div>
                <SectionHeader title="打球速度" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatCard label="平均打球速度" value={`${ev.avgSpeed}km`} highlight />
                  <StatCard label="最大打球速度" value={`${ev.maxSpeed}km`} highlight />
                  <StatCard label="平均順位" value={`${ev.avgRank}位`} />
                  <StatCard label="MAX順位" value={`${ev.maxRank}位`} />
                </div>
              </div>
            )}

            {/* Pulldown Velocity */}
            {pd && (
              <div>
                <SectionHeader title="プルダウン球速" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatCard label="平均球速" value={`${pd.avgSpeed}km`} highlight />
                  <StatCard label="最大球速" value={`${pd.maxSpeed}km`} highlight />
                  <StatCard label="平均順位" value={`${pd.avgRank}位`} />
                  <StatCard label="MAX順位" value={`${pd.maxRank}位`} />
                </div>
              </div>
            )}
          </TabsContent>
        )}

        {/* ===== Physical Tab ===== */}
        {hasPhysical && (
          <TabsContent value="physical" className="mt-4 space-y-6">
            {/* Radar Chart */}
            {radarData.length > 0 && (
              <div>
                <SectionHeader title="フィジカル レーダーチャート（高校野球部平均=100）" />
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <div className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke="#e5e5e5" />
                          <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fontWeight: 700, fill: "#212121" }} />
                          <PolarRadiusAxis angle={90} domain={[0, 200]} tick={{ fontSize: 9, fill: "#999" }} tickCount={5} />
                          <Radar name="高校平均" dataKey="average" stroke="#999" fill="#e5e5e5" fillOpacity={0.3} strokeWidth={1} strokeDasharray="4 4" />
                          <Radar name={member.name} dataKey="player" stroke="#E53935" fill="#E53935" fillOpacity={0.2} strokeWidth={2} />
                          <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                          <Tooltip
                            contentStyle={{ fontSize: 11, border: "1px solid #212121" }}
                            formatter={(value: number, name: string, props: any) => {
                              const item = props.payload;
                              if (name === member.name) return [`${value}% (${item.playerRaw}${item.unit})`, name];
                              return [`${value}% (${item.avgRaw}${item.unit})`, "高校平均"];
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground text-center">
                      ※ 100 = 高校野球部平均値。27m走は速いほど高スコア。ウェイトはトータルボリューム基準。
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Physical time series */}
            {physicalChartData.length > 0 && (
              <Card className="border border-border">
                <CardContent className="p-4">
                  <SectionHeader title="フィジカル推移グラフ" />
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={physicalChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #212121" }} labelFormatter={(v) => new Date(v).toLocaleDateString("ja-JP")} />
                        <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value) => PHYSICAL_LABELS[value]?.label ?? value} />
                        {physicalCategories.map((cat) => (
                          <Line key={cat} type="monotone" dataKey={cat} stroke={PHYS_COLORS[cat] || "#212121"} strokeWidth={2} dot={{ r: 2 }} connectNulls name={cat} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Latest values comparison table */}
            <div>
              <SectionHeader title="最新フィジカルデータ vs 高校平均" />
              <div className="border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="p-2 text-left font-bold">種目</th>
                      <th className="p-2 text-center font-bold">最新記録</th>
                      <th className="p-2 text-center font-bold">高校平均</th>
                      <th className="p-2 text-center font-bold">比較</th>
                    </tr>
                  </thead>
                  <tbody>
                    {radarData.map((r) => (
                      <tr key={r.category} className="border-b border-border hover:bg-accent/30">
                        <td className="p-2 font-bold">{r.category}</td>
                        <td className="p-2 text-center font-black">{r.playerRaw}{r.unit}</td>
                        <td className="p-2 text-center text-muted-foreground">{r.avgRaw}{r.unit}</td>
                        <td className="p-2 text-center">
                          {r.player > 100 ? (
                            <span className="text-green-600 font-bold flex items-center justify-center gap-1">
                              <TrendingUp className="h-3 w-3" /> +{r.player - 100}%
                            </span>
                          ) : r.player < 100 ? (
                            <span className="text-red-600 font-bold flex items-center justify-center gap-1">
                              <TrendingDown className="h-3 w-3" /> {r.player - 100}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground flex items-center justify-center gap-1">
                              <Minus className="h-3 w-3" /> 平均
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Physical data table */}
            <div>
              <SectionHeader title="フィジカル測定履歴" />
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
                        <td className="p-2 text-center font-bold">{p.value}{PHYSICAL_LABELS[p.category]?.unit ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        )}

        {/* ===== Game Records Tab ===== */}
        {hasRecords && (
          <TabsContent value="records" className="mt-4 space-y-4">
            {battingChartData.length > 1 && (
              <Card className="border border-border">
                <CardContent className="p-4">
                  <SectionHeader title="打率推移" />
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
      </Tabs>

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
