import { cn } from "@/lib/utils";
import * as React from "react";

function Progress({ value = 0, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { value?: number }) {
  return (
    <div className={cn("relative h-3 w-full overflow-hidden rounded-full bg-(--color-surface)", className)} {...props}>
      <div
        className="h-full rounded-full bg-linear-to-r from-(--color-primary) to-emerald-400 transition-all duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export { Progress };
