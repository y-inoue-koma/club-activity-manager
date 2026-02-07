import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const POSITION_OPTIONS = [
  "投手", "捕手", "一塁手", "二塁手", "三塁手", "遊撃手", "左翼手", "中堅手", "右翼手", "指名打者",
];

const ROLE_LABELS: Record<string, string> = {
  player: "選手",
  manager: "マネージャー",
  coach: "コーチ",
};

export default function Members() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const { data: membersList, isLoading } = trpc.members.list.useQuery();
  const createMutation = trpc.members.create.useMutation({
    onSuccess: () => { utils.members.list.invalidate(); setDialogOpen(false); toast.success("部員を追加しました"); },
  });
  const updateMutation = trpc.members.update.useMutation({
    onSuccess: () => { utils.members.list.invalidate(); setDialogOpen(false); setEditingMember(null); toast.success("部員情報を更新しました"); },
  });
  const deleteMutation = trpc.members.delete.useMutation({
    onSuccess: () => { utils.members.list.invalidate(); toast.success("部員を退部処理しました"); },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      grade: fd.get("grade") as "1" | "2" | "3",
      position: (fd.get("position") as string) || undefined,
      uniformNumber: fd.get("uniformNumber") ? Number(fd.get("uniformNumber")) : undefined,
      memberRole: (fd.get("memberRole") as any) || "player",
    };
    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Group by grade
  const grouped = membersList?.reduce((acc, m) => {
    const key = m.grade;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, typeof membersList>) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="accent-square-lg" />
            <h1 className="text-2xl font-black tracking-tight uppercase">Members</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-7">部員管理 ・ {membersList?.length ?? 0}名</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingMember(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 font-semibold uppercase tracking-wider text-xs">
                <Plus className="h-4 w-4" /> 部員追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-bold">{editingMember ? "部員情報を編集" : "部員追加"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">氏名</Label>
                  <Input id="name" name="name" required defaultValue={editingMember?.name} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="grade">学年</Label>
                    <Select name="grade" defaultValue={editingMember?.grade || "1"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1年</SelectItem>
                        <SelectItem value="2">2年</SelectItem>
                        <SelectItem value="3">3年</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uniformNumber">背番号</Label>
                    <Input id="uniformNumber" name="uniformNumber" type="number" defaultValue={editingMember?.uniformNumber} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="position">ポジション</Label>
                    <Select name="position" defaultValue={editingMember?.position || ""}>
                      <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                      <SelectContent>
                        {POSITION_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberRole">役割</Label>
                    <Select name="memberRole" defaultValue={editingMember?.memberRole || "player"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="player">選手</SelectItem>
                        <SelectItem value="manager">マネージャー</SelectItem>
                        <SelectItem value="coach">コーチ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingMember ? "更新" : "追加"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="swiss-divider" />

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">読み込み中...</div>
      ) : membersList && membersList.length > 0 ? (
        <div className="space-y-6">
          {["3", "2", "1"].map((grade) => {
            const gradeMembers = grouped[grade];
            if (!gradeMembers || gradeMembers.length === 0) return null;
            return (
              <div key={grade}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="accent-square" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em]">
                    {grade}年生 ({gradeMembers.length}名)
                  </h3>
                </div>
                <div className="swiss-divider-light mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {gradeMembers.map((member) => (
                    <Card
                      key={member.id}
                      className="border border-border hover:border-foreground transition-colors cursor-pointer group"
                      onClick={() => setLocation(`/members/${member.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-black text-sm shrink-0">
                              {member.uniformNumber ?? "-"}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{member.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground">
                                  {member.position || "未設定"}
                                </span>
                                <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0">
                                  {ROLE_LABELS[member.memberRole]}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); setEditingMember(member); setDialogOpen(true); }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); if (confirm(`${member.name}を退部処理しますか？`)) deleteMutation.mutate({ id: member.id }); }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">部員がまだ登録されていません</p>
        </div>
      )}
    </div>
  );
}
