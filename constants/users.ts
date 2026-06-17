import { Crown, ShieldCheck, User } from "lucide-react";
import React from "react";

export const ROLE_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline"; icon: React.ElementType; color: string }
> = {
  ADMIN: { label: "Admin", variant: "default", icon: Crown, color: "text-amber-400" },
  PM: { label: "PM", variant: "secondary", icon: ShieldCheck, color: "text-(--color-primary)" },
  MEMBER: { label: "Member", variant: "outline", icon: User, color: "text-muted-foreground" }
};
