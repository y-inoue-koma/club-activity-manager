import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const CATEGORIES = [
  { key: "sprint_27m", label: "27m走", unit: "秒", lower: true },
  { key: "bench_press", label: "ベンチプレス", unit: "kg", lower: false },
  { key: "clean", label: "クリーン", unit: "kg", lower: false },
  { key: "deadlift", label: "デッドリフト", unit: "kg", lower: false },
] as const;

const COLORS = [
  "#E53935", "#212121", "#757575", "#D32F2F", "#424242",
  "#9E9E9E", "#C62828", "#616161", "#B71C1C", "#333333",
  "#EF5350", "#F44336", "#E57373", "#FFCDD2", "#FF8A80",
  "#FF5252", "#FF1744",
];

export default function PhysicalData() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("sprint_27m");

  const { data: measurements, isLoading } = trpc.physical.list.useQuery({ category: activeCategory });

  // Group by member for chart
  const chartData = useMemo(() => {
    if (!measurements || measurements.length === 0) return { dates: [] as string[], members: [] as string[], series: [] as any[] };

    const dateSet = new Set<string>();
    const memberMap = new Map<string, Map<string, number>>();

    for (const m of measurements) {
      const name = m.memberName ?? "不明";
      dateSet.add(m.measureDate);
      if (!memberMap.has(name)) memberMap.set(name, new Map());
      memberMap.get(name)!.set(m.measureDate, Number(m.value));
    }

    const dates = Array.from(dateSet).sort();
    const memberNames = Array.from(memberMap.keys());

    const series = dates.map((date) => {
      const point: any = { date };
      for (const name of memberNames) {
        point[name] = memberMap.get(name)?.get(date) ?? null;
      }
      return point;
    });

    return { dates, members: memberNames, series };
  }, [measurements]);

  // Latest values for ranking
  const latestValues = useMemo(() => {
    if (!measurements || measurements.length === 0) return [];

    const memberLatest = new Map<number, { memberName: string; memberId: number; value: number; date: string }>();
    for (const m of measurements) {
      const existing = memberLatest.get(m.memberId);
      if (!existing || m.measureDate > existing.date) {
        memberLatest.set(m.memberId, {
          memberName: m.memberName ?? "不明",
          memberId: m.memberId,
          value: Number(m.value),
          date: m.measureDate,
        });
      }
    }

    const cat = CATEGORIES.find((c) => c.key === activeCategory);
    const sorted = Array.from(memberLatest.values()).sort((a, b) =>
      cat?.lower ? a.value - b.value : b.value - a.value
    );
    return sorted;
  }, [measurements, activeCategory]);

  const activeCat = CATEGORIES.find((c) => c.key === activeCategory)!;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="accent-square-lg" />
          <h1 className="text-2xl font-black tracking-tight uppercase">Physical</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-7">フィジカル測定データ</p>
      </div>

      <div className="swiss-divider" />

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.key} value={cat.key} className="text-xs font-semibold">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.key} value={cat.key} className="mt-4">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">読み込み中...</div>
            ) : (
              <div className="space-y-6">
                {/* Chart */}
                {chartData.series.length > 0 && (
                  <Card className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="accent-square" />
                        <h3 className="text-sm font-bold uppercase tracking-[0.1em]">
                          {activeCat.label} 推移グラフ
                        </h3>
                      </div>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData.series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(v) => {
                                const d = new Date(v);
                                return `${d.getMonth() + 1}/${d.getDate()}`;
                              }}
                            />
                            <YAxis
                              tick={{ fontSize: 10 }}
                              domain={["auto", "auto"]}
                              label={{ value: activeCat.unit, position: "insideLeft", style: { fontSize: 10 } }}
                            />
                            <Tooltip
                              contentStyle={{ fontSize: 11, border: "1px solid #212121" }}
                              labelFormatter={(v) => new Date(v).toLocaleDateString("ja-JP")}
                            />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            {chartData.members.map((name, idx) => (
                              <Line
                                key={name}
                                type="monotone"
                                dataKey={name}
                                stroke={COLORS[idx % COLORS.length]}
                                strokeWidth={1.5}
                                dot={{ r: 2 }}
                                connectNulls
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Ranking */}
                {latestValues.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="accent-square" />
                      <h3 className="text-sm font-bold uppercase tracking-[0.1em]">
                        最新ランキング ({activeCat.unit})
                      </h3>
                    </div>
                    <div className="border border-border overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="p-2 text-center font-bold w-12">順位</th>
                            <th className="p-2 text-left font-bold">選手</th>
                            <th className="p-2 text-center font-bold">記録</th>
                            <th className="p-2 text-center font-bold">測定日</th>
                          </tr>
                        </thead>
                        <tbody>
                          {latestValues.map((v, idx) => (
                            <tr
                              key={v.memberId}
                              className="border-b border-border hover:bg-accent/30 transition-colors cursor-pointer"
                              onClick={() => setLocation(`/members/${v.memberId}`)}
                            >
                              <td className="p-2 text-center">
                                {idx < 3 ? (
                                  <span className={`inline-flex items-center justify-center w-6 h-6 font-black text-xs ${idx === 0 ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}>
                                    {idx + 1}
                                  </span>
                                ) : (
                                  <span className="font-bold">{idx + 1}</span>
                                )}
                              </td>
                              <td className="p-2 font-semibold">{v.memberName}</td>
                              <td className="p-2 text-center font-bold text-primary">
                                {v.value}{activeCat.unit}
                              </td>
                              <td className="p-2 text-center text-muted-foreground">{v.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
