"use client";

import { createUser } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_OPTIONS } from "@/constants/options";
import { Loader2, Plus, Shield } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "PM" | "MEMBER">("MEMBER");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("MEMBER");
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("role", role);

    startTransition(async () => {
      const result = await createUser(null, formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Tạo người dùng thành công!");
        resetForm();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="text-primary h-5 w-5" />
            Thêm người dùng mới
          </DialogTitle>
          <DialogDescription>Tạo tài khoản và phân quyền truy cập hệ thống</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-name">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-password">
              Mật khẩu <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-password"
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
                      ? "bg-primary/10 border-primary"
                      : "hover:border-primary/50 border-(--color-border) bg-(--color-surface)"
                  }`}
                >
                  <p className={`text-xs font-bold ${role === opt.value ? "text-primary" : "text-(--color-text)"}`}>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Tạo người dùng
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
