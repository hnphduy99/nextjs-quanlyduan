"use client";

import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderKanban, LogIn } from "lucide-react";
import { useActionState } from "react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="from-primary shadow-primary/20 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br to-emerald-400 shadow-lg">
            <FolderKanban className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dynamic</h1>
          <p className="text-muted-foreground">Hệ thống Quản lý Dự án</p>
        </div>

        {/* Login Form */}
        <div className="border-border rounded-2xl border bg-(--color-surface-elevated) p-8 shadow-xl">
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@test.com" required autoFocus />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>

            {state?.error && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
                {state.error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                "Đang đăng nhập..."
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </>
              )}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="border-border mt-6 border-t pt-6">
            <p className="text-muted-foreground mb-3 text-center text-xs">Tài khoản demo</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label: "Admin", email: "admin@test.com" },
                { label: "PM", email: "pm@test.com" },
                { label: "Member", email: "member@test.com" }
              ].map((acc) => (
                <div
                  key={acc.email}
                  className="text-muted-foreground rounded-lg bg-(--color-surface) px-2 py-1.5 text-center"
                >
                  <p className="font-medium">{acc.label}</p>
                  <p className="truncate">{acc.email}</p>
                  <p>123456</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
