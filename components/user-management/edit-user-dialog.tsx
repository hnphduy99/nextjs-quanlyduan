"use client";

import { updateUser } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string; email: string; role: "ADMIN" | "PM" | "MEMBER" };
}

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin", desc: "Toàn quyền" },
  { value: "PM", label: "PM", desc: "Quản lý" },
  { value: "MEMBER", label: "Member", desc: "Nhân viên" }
] as const;

export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "PM" | "MEMBER">(user.role);

  useEffect(() => {
    if (open) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setPassword("");
      setError("");
    }
  }, [open, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.set("id", user.id);
    formData.set("name", name);
    formData.set("email", email);
    formData.set("role", role);
    if (password) formData.set("password", password);

    startTransition(async () => {
      const result = await updateUser(null, formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Cập nhật thành công!");
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-amber-400" />
            Chỉnh sửa người dùng
          </DialogTitle>
          <DialogDescription>Cập nhật thông tin và vai trò của {user.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Họ và tên</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-password">Mật khẩu mới (để trống nếu không đổi)</Label>
            <Input
              id="edit-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          <div className="space-y-2">
            <Label>Vai trò</Label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`rounded-lg border p-2.5 text-left transition-all ${
                    role === opt.value
                      ? "border-(--color-primary) bg-primary/10"
                      : "border-(--color-border) bg-(--color-surface) hover:border-(--color-primary)/50"
                  }`}
                >
                  <p className={`text-xs font-bold ${role === opt.value ? "text-(--color-primary)" : "text-(--color-text)"}`}>
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-(--color-text-muted)">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-(--color-destructive)/30 bg-(--color-destructive)/10 px-4 py-2.5 text-sm text-(--color-destructive)">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
              ) : (
                <><Pencil className="h-4 w-4" /> Lưu thay đổi</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
