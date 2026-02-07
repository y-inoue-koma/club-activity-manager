import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RESULT_LABELS: Record<string, string> = {
  win: "勝利",
  loss: "敗北",
  draw: "引分",
  cancelled: "中止",
};

const RESULT_COLORS: Record<string, string> = {
  win: "bg-primary text-primary-foreground",
  loss: "bg-muted text-muted-foreground",
  draw: "bg-foreground text-background",
  cancelled: "bg-border text-muted-foreground",
};

export default function GameResults() {
  const { data: games, isLoading } = trpc.gameResults.list.useQuery();
  const { data: teamStat } = trpc.teamStats.get.useQuery();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">読み込み中...</div>;
  }

  const wins = games?.filter((g) => g.result === "win").length ?? 0;
  const losses = games?.filter((g) => g.result === "loss").length ?? 0;
  const draws = games?.filter((g) => g.result === "draw").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="accent-square-lg" />
          <h1 className="text-2xl font-black tracking-tight uppercase">Games</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-7">試合結果一覧</p>
      </div>

      <div className="swiss-divider" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black tracking-tight">{games?.length ?? 0}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">総試合数</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black tracking-tight text-primary">{wins}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">勝利</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black tracking-tight">{losses}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">敗北</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black tracking-tight">
              {teamStat?.winRate ? `${(Number(teamStat.winRate) * 100).toFixed(0)}%` : "-"}
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-medium mt-1">勝率</p>
          </CardContent>
        </Card>
      </div>

      {/* Game list */}
      {games && games.length > 0 ? (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-2 text-center font-bold w-10">#</th>
                <th className="p-2 text-center font-bold">日付</th>
                <th className="p-2 text-center font-bold">結果</th>
                <th className="p-2 text-left font-bold">対戦相手</th>
                <th className="p-2 text-center font-bold">スコア</th>
                <th className="p-2 text-center font-bold">先/後</th>
                <th className="p-2 text-center font-bold">回</th>
                <th className="p-2 text-left font-bold">備考</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                  <td className="p-2 text-center font-bold">{g.gameNumber ?? "-"}</td>
                  <td className="p-2 text-center whitespace-nowrap">{g.gameDate}</td>
                  <td className="p-2 text-center">
                    <Badge className={`text-[10px] font-bold ${RESULT_COLORS[g.result]}`}>
                      {RESULT_LABELS[g.result]}
                    </Badge>
                  </td>
                  <td className="p-2 font-semibold">{g.opponent}</td>
                  <td className="p-2 text-center font-bold whitespace-nowrap">
                    {g.teamScore !== null && g.opponentScore !== null
                      ? `${g.teamScore} - ${g.opponentScore}`
                      : "-"}
                  </td>
                  <td className="p-2 text-center">{g.homeAway || "-"}</td>
                  <td className="p-2 text-center">{g.innings || "-"}</td>
                  <td className="p-2 text-muted-foreground truncate max-w-[200px]">{g.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">試合結果データがありません</p>
        </div>
      )}
    </div>
  );
}
