import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants: Record<string, string> = {
    default: "bg-[var(--color-primary)] text-white",
    secondary:
      "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
    destructive: "bg-[var(--color-destructive)] text-white",
    outline:
      "border border-[var(--color-border)] text-[var(--color-text)] bg-transparent",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
