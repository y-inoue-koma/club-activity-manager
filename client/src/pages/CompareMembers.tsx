import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { GitCompareArrows, Users, X } from "lucide-react";

const COLORS = ["#dc2626", "#1a1a1a", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];

// 高校野球部平均フィジカルデータ
const PHYSICAL_AVG: Record<string, number> = {
  sprint_27m: 3.8,
  bench_press: 60,
  clean: 55,
  deadlift: 120,
};

const PHYSICAL_LABELS: Record<string, string> = {
  sprint_27m: "27m走",
  bench_press: "ベンチプレス",
  clean: "クリーン",
  deadlift: "デッドリフト",
};

type CompareTab = "batting" | "physical" | "velocity";

export default function CompareMembers() {
  const { data: membersList } = trpc.members.list.useQuery();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<CompareTab>("batting");

  const queryEnabled = selectedIds.length >= 2;
  const stableIds = useMemo(() => selectedIds, [selectedIds.join(",")]);

  const { data: compareData, isLoading } = trpc.compare.members.useQuery(
    { memberIds: stableIds },
    { enabled: queryEnabled }
  );

  const toggleMember = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
  };

  const removeMember = (id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  // Build batting comparison data
  const battingCompareData = useMemo(() => {
    if (!compareData) return [];
    const metrics = [
      { key: "battingAvg", label: "打率" },
      { key: "onBasePercentage", label: "出塁率" },
      { key: "sluggingPercentage", label: "長打率" },
      { key: "ops", label: "OPS" },
    ];
    return metrics.map((m) => {
      const row: Record<string, string | number> = { metric: m.label };
      compareData.forEach((d, i) => {
        const batting = d.batting?.[0];
        const val = batting ? Number((batting as Record<string, unknown>)[m.key] ?? 0) : 0;
        row[d.member?.name || `選手${i + 1}`] = val;
      });
      return row;
    });
  }, [compareData]);

  // Build batting detail table
  const battingDetailRows = useMemo(() => {
    if (!compareData) return [];
    const fields: { key: string; label: string; format?: (v: unknown) => string }[] = [
      { key: "games", label: "試合数" },
      { key: "plateAppearances", label: "打席" },
      { key: "atBats", label: "打数" },
      { key: "hits", label: "安打" },
      { key: "doubles", label: "二塁打" },
      { key: "triples", label: "三塁打" },
      { key: "homeRuns", label: "本塁打" },
      { key: "rbis", label: "打点" },
      { key: "runs", label: "得点" },
      { key: "stolenBases", label: "盗塁" },
      { key: "walks", label: "四死球" },
      { key: "strikeouts", label: "三振" },
      { key: "battingAvg", label: "打率", format: (v) => Number(v).toFixed(3) },
      { key: "onBasePercentage", label: "出塁率", format: (v) => Number(v).toFixed(3) },
      { key: "sluggingPercentage", label: "長打率", format: (v) => Number(v).toFixed(3) },
      { key: "ops", label: "OPS", format: (v) => Number(v).toFixed(3) },
      { key: "vsLeftAvg", label: "対左打率", format: (v) => v ? Number(v).toFixed(3) : "-" },
      { key: "vsRightAvg", label: "対右打率", format: (v) => v ? Number(v).toFixed(3) : "-" },
    ];
    return fields.map((f) => {
      const row: Record<string, string | number> = { label: f.label };
      compareData.forEach((d) => {
        const batting = d.batting?.[0] as Record<string, unknown> | undefined;
        const raw = batting ? batting[f.key] : null;
        row[d.member?.name || "?"] = raw != null ? (f.format ? f.format(raw) : String(raw)) : "-";
      });
      return row;
    });
  }, [compareData]);

  // Build physical radar data
  const physicalRadarData = useMemo(() => {
    if (!compareData) return [];
    const categories = ["sprint_27m", "bench_press", "clean", "deadlift"];
    return categories.map((cat) => {
      const row: Record<string, string | number> = { subject: PHYSICAL_LABELS[cat] };
      compareData.forEach((d) => {
        const physicals = d.physical || [];
        const latest = physicals
          .filter((p: Record<string, unknown>) => p.category === cat)
          .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
            String(b.measureDate || "").localeCompare(String(a.measureDate || ""))
          )[0] as Record<string, unknown> | undefined;
        const val = latest ? Number(latest.value ?? 0) : 0;
        const avg = PHYSICAL_AVG[cat];
        // For sprint, lower is better → invert
        const score = cat === "sprint_27m"
          ? val > 0 ? Math.round((avg / val) * 100) : 0
          : avg > 0 ? Math.round((val / avg) * 100) : 0;
        row[d.member?.name || "?"] = score;
      });
      return row;
    });
  }, [compareData]);

  // Build velocity comparison
  const velocityCompareData = useMemo(() => {
    if (!compareData) return [];
    const metrics = [
      { label: "打球速度(平均)", getData: (d: Record<string, unknown[]>) => {
        const ev = d.exitVelocity?.[0] as Record<string, unknown> | undefined;
        return ev ? Number(ev.avgSpeed ?? 0) : 0;
      }},
      { label: "打球速度(最大)", getData: (d: Record<string, unknown[]>) => {
        const ev = d.exitVelocity?.[0] as Record<string, unknown> | undefined;
        return ev ? Number(ev.maxSpeed ?? 0) : 0;
      }},
      { label: "プルダウン(平均)", getData: (d: Record<string, unknown[]>) => {
        const pd = d.pulldown?.[0] as Record<string, unknown> | undefined;
        return pd ? Number(pd.avgSpeed ?? 0) : 0;
      }},
      { label: "プルダウン(最大)", getData: (d: Record<string, unknown[]>) => {
        const pd = d.pulldown?.[0] as Record<string, unknown> | undefined;
        return pd ? Number(pd.maxSpeed ?? 0) : 0;
      }},
    ];
    return metrics.map((m) => {
      const row: Record<string, string | number> = { metric: m.label };
      compareData.forEach((d) => {
        row[d.member?.name || "?"] = m.getData(d as unknown as Record<string, unknown[]>);
      });
      return row;
    });
  }, [compareData]);

  const memberNames = compareData?.map((d) => d.member?.name || "?") ?? [];

  const tabs: { key: CompareTab; label: string }[] = [
    { key: "batting", label: "打撃成績" },
    { key: "physical", label: "フィジカル" },
    { key: "velocity", label: "球速・打球速度" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="accent-square-lg" />
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Compare
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-7">
          部員を2〜6名選択して、成績やフィジカルデータを比較できます。
        </p>
      </div>

      <div className="swiss-divider" />

      {/* Member Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="accent-square" />
          <h2 className="text-sm font-bold uppercase tracking-[0.1em]">部員を選択</h2>
          <span className="text-[10px] text-muted-foreground ml-2">
            ({selectedIds.length}/6 選択中)
          </span>
        </div>
        <div className="swiss-divider-light mb-3" />

        {/* Selected chips */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedIds.map((id, i) => {
              const m = membersList?.find((x) => x.id === id);
              return (
                <button
                  key={id}
                  onClick={() => removeMember(id)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold border transition-colors hover:bg-muted"
                  style={{ borderColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {m?.name || `#${id}`}
                  {m?.uniformNumber != null && (
                    <span className="text-muted-foreground">#{m.uniformNumber}</span>
                  )}
                  <X className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {membersList?.map((m) => {
            const isSelected = selectedIds.includes(m.id);
            const colorIdx = selectedIds.indexOf(m.id);
            return (
              <label
                key={m.id}
                className={`flex items-center gap-2 p-2 border cursor-pointer transition-colors ${
                  isSelected ? "border-foreground bg-muted/30" : "border-border hover:border-foreground/50"
                } ${!isSelected && selectedIds.length >= 6 ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleMember(m.id)}
                  disabled={!isSelected && selectedIds.length >= 6}
                />
                <div className="flex items-center gap-1.5 min-w-0">
                  {isSelected && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[colorIdx % COLORS.length] }}
                    />
                  )}
                  <span className="text-xs font-semibold truncate">{m.name}</span>
                  {m.uniformNumber != null && (
                    <span className="text-[10px] text-muted-foreground">#{m.uniformNumber}</span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Comparison Results */}
      {!queryEnabled && (
        <div className="p-8 border border-dashed border-border text-center">
          <GitCompareArrows className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            2名以上の部員を選択すると比較結果が表示されます
          </p>
        </div>
      )}

      {queryEnabled && isLoading && (
        <div className="p-8 text-center">
          <span className="accent-square animate-pulse inline-block mb-3" />
          <p className="text-sm text-muted-foreground">データを読み込み中...</p>
        </div>
      )}

      {queryEnabled && compareData && (
        <>
          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                  activeTab === tab.key
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Batting Tab */}
          {activeTab === "batting" && (
            <div className="space-y-6">
              {/* Bar Chart */}
              <Card className="border border-border">
                <CardContent className="p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4">主要打撃指標</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={battingCompareData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        domain={[0, "auto"]}
                        tick={{ fontSize: 10 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="metric"
                        width={60}
                        tick={{ fontSize: 10, fontWeight: 600 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        formatter={(value: number) => value.toFixed(3)}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                      {memberNames.map((name, i) => (
                        <Bar key={name} dataKey={name} fill={COLORS[i % COLORS.length]} barSize={12} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Detail Table */}
              <Card className="border border-border">
                <CardContent className="p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4">打撃成績詳細</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-foreground">
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-wider text-[10px]">指標</th>
                          {memberNames.map((name, i) => (
                            <th key={name} className="text-right py-2 px-2 font-black uppercase tracking-wider text-[10px]" style={{ color: COLORS[i % COLORS.length] }}>
                              {name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {battingDetailRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-border">
                            <td className="py-2 pr-4 font-semibold text-muted-foreground">{row.label}</td>
                            {memberNames.map((name, i) => {
                              // Highlight best value
                              const vals = memberNames.map((n) => Number(row[n]) || 0);
                              const max = Math.max(...vals);
                              const isBest = Number(row[name]) === max && max > 0;
                              return (
                                <td
                                  key={name}
                                  className={`text-right py-2 px-2 font-mono tabular-nums ${isBest ? "font-black" : ""}`}
                                  style={isBest ? { color: COLORS[i % COLORS.length] } : {}}
                                >
                                  {row[name]}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Physical Tab */}
          {activeTab === "physical" && (
            <div className="space-y-6">
              <Card className="border border-border">
                <CardContent className="p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4">
                    フィジカル比較（高校野球部平均 = 100）
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={physicalRadarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fontWeight: 700 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 200]}
                        tick={{ fontSize: 9 }}
                        tickCount={5}
                      />
                      {memberNames.map((name, i) => (
                        <Radar
                          key={name}
                          name={name}
                          dataKey={name}
                          stroke={COLORS[i % COLORS.length]}
                          fill={COLORS[i % COLORS.length]}
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        formatter={(value: number) => `${value}%`}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Physical Detail Table */}
              <Card className="border border-border">
                <CardContent className="p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4">フィジカル数値詳細</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-foreground">
                          <th className="text-left py-2 pr-4 font-black uppercase tracking-wider text-[10px]">種目</th>
                          <th className="text-right py-2 px-2 font-black uppercase tracking-wider text-[10px] text-muted-foreground">平均</th>
                          {memberNames.map((name, i) => (
                            <th key={name} className="text-right py-2 px-2 font-black uppercase tracking-wider text-[10px]" style={{ color: COLORS[i % COLORS.length] }}>
                              {name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(["sprint_27m", "bench_press", "clean", "deadlift"] as const).map((cat) => {
                          const unit = cat === "sprint_27m" ? "秒" : "kg";
                          return (
                            <tr key={cat} className="border-b border-border">
                              <td className="py-2 pr-4 font-semibold">{PHYSICAL_LABELS[cat]}</td>
                              <td className="text-right py-2 px-2 text-muted-foreground font-mono tabular-nums">
                                {PHYSICAL_AVG[cat]}{unit}
                              </td>
                              {compareData.map((d, i) => {
                                const physicals = d.physical || [];
                                const latest = physicals
                                  .filter((p: Record<string, unknown>) => p.category === cat)
                                  .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
                                    String(b.measureDate || "").localeCompare(String(a.measureDate || ""))
                                  )[0] as Record<string, unknown> | undefined;
                                const val = latest ? Number(latest.value ?? 0) : 0;
                                return (
                                  <td key={i} className="text-right py-2 px-2 font-mono tabular-nums font-semibold">
                                    {val > 0 ? `${val}${unit}` : "-"}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Velocity Tab */}
          {activeTab === "velocity" && (
            <div className="space-y-6">
              <Card className="border border-border">
                <CardContent className="p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4">球速・打球速度比較</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={velocityCompareData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickLine={false}
                        unit=" km/h"
                      />
                      <YAxis
                        type="category"
                        dataKey="metric"
                        width={120}
                        tick={{ fontSize: 10, fontWeight: 600 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        formatter={(value: number) => `${value} km/h`}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                      {memberNames.map((name, i) => (
                        <Bar key={name} dataKey={name} fill={COLORS[i % COLORS.length]} barSize={10} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pitcher velocity detail if any */}
              {compareData.some((d) => d.velocity && d.velocity.length > 0) && (
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-4">投手球速詳細</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b-2 border-foreground">
                            <th className="text-left py-2 pr-4 font-black uppercase tracking-wider text-[10px]">指標</th>
                            {memberNames.map((name, i) => (
                              <th key={name} className="text-right py-2 px-2 font-black uppercase tracking-wider text-[10px]" style={{ color: COLORS[i % COLORS.length] }}>
                                {name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: "avgFastball", label: "ストレート平均" },
                            { key: "maxFastball", label: "ストレート最速" },
                            { key: "avgBreaking", label: "変化球平均" },
                            { key: "maxBreaking", label: "変化球最速" },
                          ].map((field) => (
                            <tr key={field.key} className="border-b border-border">
                              <td className="py-2 pr-4 font-semibold">{field.label}</td>
                              {compareData.map((d, i) => {
                                const vel = d.velocity?.[0] as Record<string, unknown> | undefined;
                                const val = vel ? Number(vel[field.key] ?? 0) : 0;
                                return (
                                  <td key={i} className="text-right py-2 px-2 font-mono tabular-nums font-semibold">
                                    {val > 0 ? `${val} km/h` : "-"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
