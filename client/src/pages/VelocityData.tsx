import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

export default function VelocityData() {
  const [, setLocation] = useLocation();
  const { data: pitchVel, isLoading: loadingPitch } = trpc.velocity.pitchList.useQuery();
  const { data: exitVel, isLoading: loadingExit } = trpc.velocity.exitList.useQuery();
  const { data: pulldownVel, isLoading: loadingPulldown } = trpc.velocity.pulldownList.useQuery();

  const isLoading = loadingPitch || loadingExit || loadingPulldown;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="accent-square-lg" />
          <h1 className="text-2xl font-black tracking-tight uppercase">Velocity</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-7">球速・打球速度データ</p>
      </div>

      <div className="swiss-divider" />

      <Tabs defaultValue="pitch" className="w-full">
        <TabsList>
          <TabsTrigger value="pitch" className="text-xs font-semibold">投手球速</TabsTrigger>
          <TabsTrigger value="exit" className="text-xs font-semibold">打球速度</TabsTrigger>
          <TabsTrigger value="pulldown" className="text-xs font-semibold">プルダウン</TabsTrigger>
        </TabsList>

        {/* Pitch Velocity */}
        <TabsContent value="pitch" className="mt-4">
          {pitchVel && pitchVel.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pitchVel.map((v) => (
                  <Card
                    key={v.id}
                    className="border border-border hover:border-foreground transition-colors cursor-pointer"
                    onClick={() => setLocation(`/members/${v.memberId}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shrink-0">
                          {v.memberName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{v.memberName}</p>
                          <p className="text-[10px] text-muted-foreground">{v.grade}年</p>
                        </div>
                      </div>
                      <div className="swiss-divider-light mb-3" />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">ストレート平均</p>
                          <p className="text-xl font-black">{v.avgFastball}<span className="text-xs font-normal ml-0.5">km/h</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">ストレート最速</p>
                          <p className="text-xl font-black text-primary">{v.maxFastball}<span className="text-xs font-normal ml-0.5">km/h</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">変化球平均</p>
                          <p className="text-xl font-black">{v.avgBreaking}<span className="text-xs font-normal ml-0.5">km/h</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">変化球最速</p>
                          <p className="text-xl font-black">{v.maxBreaking}<span className="text-xs font-normal ml-0.5">km/h</span></p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">投手球速データがありません</p>
            </div>
          )}
        </TabsContent>

        {/* Exit Velocity */}
        <TabsContent value="exit" className="mt-4">
          {exitVel && exitVel.length > 0 ? (
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-2 text-left font-bold uppercase tracking-wider">順位</th>
                    <th className="p-2 text-left font-bold uppercase tracking-wider">選手</th>
                    <th className="p-2 text-center font-bold">平均(km/h)</th>
                    <th className="p-2 text-center font-bold">平均順位</th>
                    <th className="p-2 text-center font-bold">最速(km/h)</th>
                    <th className="p-2 text-center font-bold">最速順位</th>
                  </tr>
                </thead>
                <tbody>
                  {exitVel.map((v, idx) => (
                    <tr
                      key={v.id}
                      className="border-b border-border hover:bg-accent/30 transition-colors cursor-pointer"
                      onClick={() => setLocation(`/members/${v.memberId}`)}
                    >
                      <td className="p-2 font-bold">{idx + 1}</td>
                      <td className="p-2 font-semibold">{v.memberName}</td>
                      <td className="p-2 text-center font-bold">{v.avgSpeed}</td>
                      <td className="p-2 text-center">{v.avgRank ?? "-"}</td>
                      <td className="p-2 text-center font-bold text-primary">{v.maxSpeed}</td>
                      <td className="p-2 text-center">{v.maxRank ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">打球速度データがありません</p>
            </div>
          )}
        </TabsContent>

        {/* Pulldown Velocity */}
        <TabsContent value="pulldown" className="mt-4">
          {pulldownVel && pulldownVel.length > 0 ? (
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-2 text-left font-bold uppercase tracking-wider">順位</th>
                    <th className="p-2 text-left font-bold uppercase tracking-wider">選手</th>
                    <th className="p-2 text-center font-bold">平均(km/h)</th>
                    <th className="p-2 text-center font-bold">平均順位</th>
                    <th className="p-2 text-center font-bold">最速(km/h)</th>
                    <th className="p-2 text-center font-bold">最速順位</th>
                  </tr>
                </thead>
                <tbody>
                  {pulldownVel.map((v, idx) => (
                    <tr
                      key={v.id}
                      className="border-b border-border hover:bg-accent/30 transition-colors cursor-pointer"
                      onClick={() => setLocation(`/members/${v.memberId}`)}
                    >
                      <td className="p-2 font-bold">{idx + 1}</td>
                      <td className="p-2 font-semibold">{v.memberName}</td>
                      <td className="p-2 text-center font-bold">{v.avgSpeed}</td>
                      <td className="p-2 text-center">{v.avgRank ?? "-"}</td>
                      <td className="p-2 text-center font-bold text-primary">{v.maxSpeed}</td>
                      <td className="p-2 text-center">{v.maxRank ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">プルダウン球速データがありません</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
