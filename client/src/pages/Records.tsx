import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Pencil, Brain, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Streamdown } from "streamdown";

export default function Records() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const { data: membersList } = trpc.members.list.useQuery();
  const { data: records } = trpc.records.list.useQuery(
    { memberId: selectedMemberId! },
    { enabled: !!selectedMemberId }
  );
  const { data: summary } = trpc.records.summary.useQuery(
    { memberId: selectedMemberId! },
    { enabled: !!selectedMemberId }
  );

  const selectedMember = membersList?.find((m) => m.id === selectedMemberId);

  const createMutation = trpc.records.create.useMutation({
    onSuccess: () => {
      utils.records.list.invalidate();
      utils.records.summary.invalidate();
      setDialogOpen(false);
      toast.success("成績を記録しました");
    },
  });
  const deleteMutation = trpc.records.delete.useMutation({
    onSuccess: () => {
      utils.records.list.invalidate();
      utils.records.summary.invalidate();
      toast.success("成績を削除しました");
    },
  });
  const aiMutation = trpc.records.aiAnalysis.useMutation({
    onSuccess: (data) => {
      setAiAnalysis(data.analysis as string);
      setAiDialogOpen(true);
    },
    onError: () => toast.error("AI分析に失敗しました"),
  });

  // Compute batting average over time for chart
  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    let cumAtBats = 0;
    let cumHits = 0;
    return records.map((r) => {
      cumAtBats += r.atBats ?? 0;
      cumHits += r.hits ?? 0;
      const avg = cumAtBats > 0 ? (cumHits / cumAtBats) : 0;
      return {
        date: r.recordDate,
        battingAvg: Number(avg.toFixed(3)),
        atBats: r.atBats ?? 0,
        hits: r.hits ?? 0,
      };
    });
  }, [records]);

  const battingAvg = summary && Number(summary.totalAtBats) > 0
    ? (Number(summary.totalHits) / Number(summary.totalAtBats)).toFixed(3)
    : "---";
  const era = summary && Number(summary.totalInningsPitched) > 0
    ? ((Number(summary.totalEarnedRuns) * 9) / Number(summary.totalInningsPitched)).toFixed(2)
    : "---";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    const fd = new FormData(e.currentTarget);
    const data = {
      memberId: selectedMemberId,
      recordDate: fd.get("recordDate") as string,
      atBats: Number(fd.get("atBats") || 0),
      hits: Number(fd.get("hits") || 0),
      doubles: Number(fd.get("doubles") || 0),
      triples: Number(fd.get("triples") || 0),
      homeRuns: Number(fd.get("homeRuns") || 0),
      rbis: Number(fd.get("rbis") || 0),
      runs: Number(fd.get("runs") || 0),
      strikeouts: Number(fd.get("strikeouts") || 0),
      walks: Number(fd.get("walks") || 0),
      stolenBases: Number(fd.get("stolenBases") || 0),
      inningsPitched: (fd.get("inningsPitched") as string) || undefined,
      earnedRuns: Number(fd.get("earnedRuns") || 0),
      pitchStrikeouts: Number(fd.get("pitchStrikeouts") || 0),
      pitchWalks: Number(fd.get("pitchWalks") || 0),
      hitsAllowed: Number(fd.get("hitsAllowed") || 0),
      wins: Number(fd.get("wins") || 0),
      losses: Number(fd.get("losses") || 0),
      notes: (fd.get("notes") as string) || undefined,
    };
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="accent-square-lg" />
            <h1 className="text-2xl font-black tracking-tight uppercase">Records</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-7">個人成績管理</p>
        </div>
        <div className="flex gap-2">
          {selectedMemberId && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs font-semibold"
              onClick={() => aiMutation.mutate({ memberId: selectedMemberId })}
              disabled={aiMutation.isPending}
            >
              {aiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              AI分析
            </Button>
          )}
          {isAdmin && selectedMemberId && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1 font-semibold uppercase tracking-wider text-xs">
                  <Plus className="h-4 w-4" /> 成績記録
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-bold">成績を記録 - {selectedMember?.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recordDate">日付</Label>
                    <Input id="recordDate" name="recordDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="accent-square" />
                    <span className="text-xs font-bold uppercase tracking-wider">打撃成績</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1"><Label className="text-xs">打数</Label><Input name="atBats" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">安打</Label><Input name="hits" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">二塁打</Label><Input name="doubles" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">三塁打</Label><Input name="triples" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">本塁打</Label><Input name="homeRuns" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">打点</Label><Input name="rbis" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">得点</Label><Input name="runs" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">三振</Label><Input name="strikeouts" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">四球</Label><Input name="walks" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">盗塁</Label><Input name="stolenBases" type="number" defaultValue="0" /></div>
                  </div>
                  <div className="flex items-center gap-2 mb-2 mt-4">
                    <span className="accent-square" />
                    <span className="text-xs font-bold uppercase tracking-wider">投手成績</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1"><Label className="text-xs">投球回</Label><Input name="inningsPitched" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">自責点</Label><Input name="earnedRuns" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">奪三振</Label><Input name="pitchStrikeouts" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">与四球</Label><Input name="pitchWalks" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">被安打</Label><Input name="hitsAllowed" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">勝</Label><Input name="wins" type="number" defaultValue="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">敗</Label><Input name="losses" type="number" defaultValue="0" /></div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="notes">メモ</Label>
                    <Textarea id="notes" name="notes" rows={2} />
                  </div>
                  <Button type="submit" className="w-full font-semibold" disabled={createMutation.isPending}>
                    記録する
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="swiss-divider" />

      {/* Member selector */}
      <div className="max-w-xs">
        <Label className="text-xs font-bold uppercase tracking-wider mb-2 block">選手を選択</Label>
        <Select
          value={selectedMemberId?.toString() || ""}
          onValueChange={(v) => setSelectedMemberId(Number(v))}
        >
          <SelectTrigger><SelectValue placeholder="選手を選択してください" /></SelectTrigger>
          <SelectContent>
            {membersList?.map((m) => (
              <SelectItem key={m.id} value={m.id.toString()}>
                {m.name} ({m.grade}年 / #{m.uniformNumber ?? "-"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMemberId && summary ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border border-border">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black tracking-tight">{battingAvg}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">打率</p>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black tracking-tight">{era}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">防御率</p>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black tracking-tight">{Number(summary.totalHomeRuns)}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">本塁打</p>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-black tracking-tight">{Number(summary.gamesCount)}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">出場試合</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="chart" className="w-full">
            <TabsList>
              <TabsTrigger value="chart" className="text-xs font-semibold">打率推移</TabsTrigger>
              <TabsTrigger value="history" className="text-xs font-semibold">成績履歴</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="mt-4">
              {chartData.length > 0 ? (
                <div className="border border-border p-4">
                  <ResponsiveContainer width="100%" height={300}>
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
              ) : (
                <div className="p-8 border border-dashed border-border text-center">
                  <p className="text-sm text-muted-foreground">成績データがありません</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {records && records.length > 0 ? (
                <div className="border border-border overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="p-2 text-left font-bold uppercase tracking-wider">日付</th>
                        <th className="p-2 text-center font-bold">打数</th>
                        <th className="p-2 text-center font-bold">安打</th>
                        <th className="p-2 text-center font-bold">HR</th>
                        <th className="p-2 text-center font-bold">打点</th>
                        <th className="p-2 text-center font-bold">三振</th>
                        <th className="p-2 text-center font-bold">四球</th>
                        <th className="p-2 text-center font-bold">投球回</th>
                        <th className="p-2 text-center font-bold">自責</th>
                        {isAdmin && <th className="p-2 text-center font-bold">操作</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => (
                        <tr key={r.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                          <td className="p-2 font-medium">{r.recordDate}</td>
                          <td className="p-2 text-center">{r.atBats}</td>
                          <td className="p-2 text-center">{r.hits}</td>
                          <td className="p-2 text-center">{r.homeRuns}</td>
                          <td className="p-2 text-center">{r.rbis}</td>
                          <td className="p-2 text-center">{r.strikeouts}</td>
                          <td className="p-2 text-center">{r.walks}</td>
                          <td className="p-2 text-center">{r.inningsPitched}</td>
                          <td className="p-2 text-center">{r.earnedRuns}</td>
                          {isAdmin && (
                            <td className="p-2 text-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => { if (confirm("削除しますか？")) deleteMutation.mutate({ id: r.id }); }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-border text-center">
                  <p className="text-sm text-muted-foreground">成績データがありません</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : selectedMemberId ? (
        <div className="p-8 border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">成績データがまだ登録されていません</p>
        </div>
      ) : null}

      {/* AI Analysis Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI成績分析 - {selectedMember?.name}
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
