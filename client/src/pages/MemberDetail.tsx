import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, Loader2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Streamdown } from "streamdown";

const ROLE_LABELS: Record<string, string> = {
  player: "選手",
  manager: "マネージャー",
  coach: "コーチ",
};

export default function MemberDetail() {
  const params = useParams<{ id: string }>();
  const memberId = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const { data: member, isLoading } = trpc.members.getById.useQuery({ id: memberId });
  const { data: records } = trpc.records.list.useQuery({ memberId });
  const { data: summary } = trpc.records.summary.useQuery({ memberId });

  const aiMutation = trpc.records.aiAnalysis.useMutation({
    onSuccess: (data) => {
      setAiAnalysis(data.analysis as string);
      setAiDialogOpen(true);
    },
  });

  const chartData = useMemo(() => {
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

      {/* Stats */}
      {summary && Number(summary.gamesCount) > 0 ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="accent-square" />
            <h2 className="text-sm font-bold uppercase tracking-[0.1em]">通算成績</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: "打率", value: battingAvg },
              { label: "出塁率", value: obp },
              { label: "防御率", value: era },
              { label: "安打", value: Number(summary.totalHits) },
              { label: "本塁打", value: Number(summary.totalHomeRuns) },
              { label: "打点", value: Number(summary.totalRbis) },
              { label: "得点", value: Number(summary.totalRuns) },
              { label: "盗塁", value: Number(summary.totalStolenBases) },
              { label: "三振", value: Number(summary.totalStrikeouts) },
              { label: "四球", value: Number(summary.totalWalks) },
              { label: "出場試合", value: Number(summary.gamesCount) },
              { label: "勝敗", value: `${Number(summary.totalWins)}-${Number(summary.totalLosses)}` },
            ].map((stat) => (
              <Card key={stat.label} className="border border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-black tracking-tight">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium mt-0.5">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <div>
              <div className="flex items-center gap-2 mb-3 mt-6">
                <span className="accent-square" />
                <h2 className="text-sm font-bold uppercase tracking-[0.1em]">打率推移</h2>
              </div>
              <div className="border border-border p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 0.5]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, border: "1px solid #000" }}
                      formatter={(value: number) => [value.toFixed(3), "打率"]}
                    />
                    <Line type="monotone" dataKey="battingAvg" stroke="oklch(0.55 0.22 25)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent records */}
          {records && records.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 mt-6">
                <span className="accent-square" />
                <h2 className="text-sm font-bold uppercase tracking-[0.1em]">成績履歴</h2>
              </div>
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
            </div>
          )}
        </>
      ) : (
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
