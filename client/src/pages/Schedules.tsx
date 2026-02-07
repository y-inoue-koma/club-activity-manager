import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ChevronLeft, ChevronRight, Trash2, Pencil } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const EVENT_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  game: "試合",
  meeting: "ミーティング",
  other: "その他",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  practice: "bg-primary",
  game: "bg-foreground",
  meeting: "bg-muted-foreground",
  other: "bg-border",
};

export default function Schedules() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const from = useMemo(() => `${year}-${String(month + 1).padStart(2, "0")}-01`, [year, month]);
  const to = useMemo(() => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }, [year, month]);

  const { data: schedules } = trpc.schedules.list.useQuery({ from, to });
  const createMutation = trpc.schedules.create.useMutation({
    onSuccess: () => { utils.schedules.list.invalidate(); setDialogOpen(false); toast.success("予定を作成しました"); },
  });
  const updateMutation = trpc.schedules.update.useMutation({
    onSuccess: () => { utils.schedules.list.invalidate(); setDialogOpen(false); setEditingSchedule(null); toast.success("予定を更新しました"); },
  });
  const deleteMutation = trpc.schedules.delete.useMutation({
    onSuccess: () => { utils.schedules.list.invalidate(); toast.success("予定を削除しました"); },
  });

  // Calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const getSchedulesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return schedules?.filter((s) => s.eventDate === dateStr) ?? [];
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      eventType: (fd.get("eventType") as any) || "practice",
      eventDate: fd.get("eventDate") as string,
      startTime: fd.get("startTime") as string,
      endTime: (fd.get("endTime") as string) || undefined,
      location: (fd.get("location") as string) || undefined,
    };
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  // Selected date events
  const selectedDateEvents = selectedDate
    ? schedules?.filter((s) => s.eventDate === selectedDate) ?? []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="accent-square-lg" />
            <h1 className="text-2xl font-black tracking-tight uppercase">Schedule</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-7">予定表・カレンダー</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingSchedule(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 font-semibold uppercase tracking-wider text-xs">
                <Plus className="h-4 w-4" /> 新規予定
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-bold">{editingSchedule ? "予定を編集" : "新規予定"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">タイトル</Label>
                  <Input id="title" name="title" required defaultValue={editingSchedule?.title} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">日付</Label>
                    <Input id="eventDate" name="eventDate" type="date" required defaultValue={editingSchedule?.eventDate || selectedDate || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventType">種別</Label>
                    <Select name="eventType" defaultValue={editingSchedule?.eventType || "practice"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="practice">練習</SelectItem>
                        <SelectItem value="game">試合</SelectItem>
                        <SelectItem value="meeting">ミーティング</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">開始時間</Label>
                    <Input id="startTime" name="startTime" type="time" required defaultValue={editingSchedule?.startTime} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">終了時間</Label>
                    <Input id="endTime" name="endTime" type="time" defaultValue={editingSchedule?.endTime} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">場所</Label>
                  <Input id="location" name="location" defaultValue={editingSchedule?.location} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">詳細</Label>
                  <Textarea id="description" name="description" rows={3} defaultValue={editingSchedule?.description} />
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingSchedule ? "更新" : "作成"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="swiss-divider" />

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-black tracking-tight">
          {year}年 {month + 1}月
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar */}
      <div className="border border-border">
        <div className="grid grid-cols-7">
          {dayNames.map((name, i) => (
            <div
              key={name}
              className={`p-2 text-center text-xs font-bold uppercase tracking-wider border-b border-border ${
                i === 0 ? "text-primary" : i === 6 ? "text-muted-foreground" : ""
              }`}
            >
              {name}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dateStr = day
              ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              : "";
            const daySchedules = day ? getSchedulesForDay(day) : [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dayOfWeek = idx % 7;

            return (
              <div
                key={idx}
                className={`min-h-[80px] p-1.5 border-b border-r border-border cursor-pointer transition-colors ${
                  day ? "hover:bg-accent/50" : ""
                } ${isSelected ? "bg-accent" : ""} ${!day ? "bg-muted/30" : ""}`}
                onClick={() => day && setSelectedDate(dateStr)}
              >
                {day && (
                  <>
                    <span
                      className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 ${
                        isToday ? "bg-primary text-primary-foreground" : ""
                      } ${dayOfWeek === 0 ? "text-primary" : dayOfWeek === 6 ? "text-muted-foreground" : ""}`}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {daySchedules.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-1"
                        >
                          <span className={`w-1.5 h-1.5 shrink-0 ${EVENT_TYPE_COLORS[s.eventType]}`} />
                          <span className="text-[10px] truncate leading-tight font-medium">
                            {s.title}
                          </span>
                        </div>
                      ))}
                      {daySchedules.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{daySchedules.length - 3}件</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected date detail */}
      {selectedDate && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="accent-square" />
            <h3 className="text-sm font-bold uppercase tracking-[0.1em]">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
            </h3>
          </div>
          <div className="swiss-divider-light mb-3" />
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedDateEvents.map((s) => (
                <Card key={s.id} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 ${EVENT_TYPE_COLORS[s.eventType]}`} />
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            {EVENT_TYPE_LABELS[s.eventType]}
                          </span>
                        </div>
                        <p className="font-bold text-sm">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.startTime}{s.endTime ? `〜${s.endTime}` : ""}
                          {s.location ? ` ・ ${s.location}` : ""}
                        </p>
                        {s.description && (
                          <p className="text-xs text-muted-foreground mt-2">{s.description}</p>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setEditingSchedule(s); setDialogOpen(true); }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => { if (confirm("この予定を削除しますか？")) deleteMutation.mutate({ id: s.id }); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-6 border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">この日の予定はありません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
