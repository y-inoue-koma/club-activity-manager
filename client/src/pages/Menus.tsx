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
import { Plus, Trash2, Pencil, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  batting: "打撃",
  fielding: "守備",
  pitching: "投球",
  running: "走塁",
  conditioning: "体力",
  other: "その他",
};

const CATEGORY_COLORS: Record<string, string> = {
  batting: "bg-primary text-primary-foreground",
  fielding: "bg-foreground text-background",
  pitching: "bg-muted-foreground text-background",
  running: "bg-primary/80 text-primary-foreground",
  conditioning: "bg-foreground/70 text-background",
  other: "bg-muted text-muted-foreground",
};

export default function Menus() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: menus, isLoading } = trpc.menus.list.useQuery();
  const createMutation = trpc.menus.create.useMutation({
    onSuccess: () => { utils.menus.list.invalidate(); setDialogOpen(false); toast.success("メニューを作成しました"); },
  });
  const updateMutation = trpc.menus.update.useMutation({
    onSuccess: () => { utils.menus.list.invalidate(); setDialogOpen(false); setEditingMenu(null); toast.success("メニューを更新しました"); },
  });
  const deleteMutation = trpc.menus.delete.useMutation({
    onSuccess: () => { utils.menus.list.invalidate(); toast.success("メニューを削除しました"); },
  });

  const filteredMenus = menus?.filter(
    (m) => filterCategory === "all" || m.category === filterCategory
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      category: fd.get("category") as any,
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      duration: fd.get("duration") ? Number(fd.get("duration")) : undefined,
      targetGroup: (fd.get("targetGroup") as string) || undefined,
    };
    if (editingMenu) {
      updateMutation.mutate({ id: editingMenu.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="accent-square-lg" />
            <h1 className="text-2xl font-black tracking-tight uppercase">Menu</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-7">練習メニュー管理</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingMenu(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 font-semibold uppercase tracking-wider text-xs">
                <Plus className="h-4 w-4" /> 新規メニュー
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-bold">{editingMenu ? "メニューを編集" : "新規メニュー"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">メニュー名</Label>
                  <Input id="title" name="title" required defaultValue={editingMenu?.title} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="category">カテゴリ</Label>
                    <Select name="category" defaultValue={editingMenu?.category || "batting"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">所要時間（分）</Label>
                    <Input id="duration" name="duration" type="number" defaultValue={editingMenu?.duration} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetGroup">対象者</Label>
                  <Input id="targetGroup" name="targetGroup" placeholder="例: 全員、投手、内野手" defaultValue={editingMenu?.targetGroup} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">内容・説明</Label>
                  <Textarea id="description" name="description" rows={4} defaultValue={editingMenu?.description} />
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingMenu ? "更新" : "作成"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="swiss-divider" />

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterCategory === "all" ? "default" : "outline"}
          size="sm"
          className="text-xs font-semibold uppercase tracking-wider"
          onClick={() => setFilterCategory("all")}
        >
          すべて
        </Button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <Button
            key={key}
            variant={filterCategory === key ? "default" : "outline"}
            size="sm"
            className="text-xs font-semibold uppercase tracking-wider"
            onClick={() => setFilterCategory(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Menu list */}
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">読み込み中...</div>
      ) : filteredMenus && filteredMenus.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredMenus.map((menu) => (
            <Card key={menu.id} className="border border-border hover:border-foreground transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[menu.category]}`}>
                        {CATEGORY_LABELS[menu.category]}
                      </Badge>
                      {menu.targetGroup && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {menu.targetGroup}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sm">{menu.title}</p>
                    {menu.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{menu.description}</p>
                    )}
                    {menu.duration && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{menu.duration}分</span>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 ml-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setEditingMenu(menu); setDialogOpen(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("削除しますか？")) deleteMutation.mutate({ id: menu.id }); }}>
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
        <div className="p-8 border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">練習メニューがまだ登録されていません</p>
        </div>
      )}
    </div>
  );
}
