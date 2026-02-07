import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  pending: "未確認",
  approved: "承認済",
  noted: "確認済",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-foreground text-background",
  noted: "bg-primary text-primary-foreground",
};

export default function Absences() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: membersList } = trpc.members.list.useQuery();
  const { data: absences, isLoading } = trpc.absences.list.useQuery();
  const { data: schedules } = trpc.schedules.list.useQuery();
  const { data: myProfile } = trpc.members.getMyProfile.useQuery();

  const createMutation = trpc.absences.create.useMutation({
    onSuccess: () => {
      utils.absences.list.invalidate();
      setDialogOpen(false);
      toast.success("欠席連絡を送信しました。管理者に通知されます。");
    },
    onError: () => toast.error("欠席連絡の送信に失敗しました"),
  });
  const updateStatusMutation = trpc.absences.updateStatus.useMutation({
    onSuccess: () => {
      utils.absences.list.invalidate();
      toast.success("ステータスを更新しました");
    },
  });

  // Reminder mutation
  const reminderMutation = trpc.reminders.checkTomorrow.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: () => toast.error("リマインダーの送信に失敗しました"),
  });

  const getMemberName = (memberId: number) => {
    return membersList?.find((m) => m.id === memberId)?.name ?? "不明";
  };

  const getScheduleTitle = (scheduleId: number | null) => {
    if (!scheduleId) return null;
    return schedules?.find((s) => s.id === scheduleId)?.title;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const memberId = myProfile?.id || Number(fd.get("memberId"));
    if (!memberId) { toast.error("部員を選択してください"); return; }
    const data = {
      memberId,
      absenceDate: fd.get("absenceDate") as string,
      reason: (fd.get("reason") as string) || undefined,
      scheduleId: fd.get("scheduleId") ? Number(fd.get("scheduleId")) : undefined,
    };
    createMutation.mutate(data);
  };

  // Upcoming schedules for selection
  const upcomingSchedules = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return schedules?.filter((s) => s.eventDate >= today) ?? [];
  }, [schedules]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="accent-square-lg" />
            <h1 className="text-2xl font-black tracking-tight uppercase">Absence</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-7">欠席連絡</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs font-semibold"
              onClick={() => reminderMutation.mutate()}
              disabled={reminderMutation.isPending}
            >
              <Bell className="h-4 w-4" />
              リマインダー送信
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 font-semibold uppercase tracking-wider text-xs">
                <Plus className="h-4 w-4" /> 欠席連絡
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-bold">欠席連絡を送信</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!myProfile && (
                  <div className="space-y-2">
                    <Label htmlFor="memberId">部員</Label>
                    <Select name="memberId">
                      <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                      <SelectContent>
                        {membersList?.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.name} ({m.grade}年)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {myProfile && (
                  <div className="p-3 bg-muted border border-border">
                    <p className="text-sm font-medium">{myProfile.name} ({myProfile.grade}年)</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="absenceDate">欠席日</Label>
                  <Input id="absenceDate" name="absenceDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduleId">対象の予定（任意）</Label>
                  <Select name="scheduleId">
                    <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                    <SelectContent>
                      {upcomingSchedules.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.eventDate} - {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">理由</Label>
                  <Textarea id="reason" name="reason" rows={3} placeholder="欠席理由を入力してください" />
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={createMutation.isPending}>
                  送信
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="swiss-divider" />

      {/* Absences list */}
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">読み込み中...</div>
      ) : absences && absences.length > 0 ? (
        <div className="space-y-2">
          {absences.map((absence) => (
            <Card key={absence.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[10px] font-bold ${STATUS_COLORS[absence.status]}`}>
                        {STATUS_LABELS[absence.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{absence.absenceDate}</span>
                    </div>
                    <p className="font-bold text-sm">{getMemberName(absence.memberId)}</p>
                    {absence.scheduleId && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        対象: {getScheduleTitle(absence.scheduleId) || "予定"}
                      </p>
                    )}
                    {absence.reason && (
                      <p className="text-xs text-muted-foreground mt-1">理由: {absence.reason}</p>
                    )}
                  </div>
                  {isAdmin && absence.status === "pending" && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => updateStatusMutation.mutate({ id: absence.id, status: "noted" })}
                      >
                        確認済
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => updateStatusMutation.mutate({ id: absence.id, status: "approved" })}
                      >
                        承認
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-8 border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">欠席連絡はありません</p>
        </div>
      )}
    </div>
  );
}
