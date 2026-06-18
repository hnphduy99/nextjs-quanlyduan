import { cn, formatDate } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  stepName: string;
  stepOrder: number;
  startDate: Date | null;
  endDate: Date | null;
}

interface StepTimelineProps {
  steps: Step[];
  currentStepOrder: number;
}

export function StepTimeline({ steps, currentStepOrder }: StepTimelineProps) {
  return (
    <div className="w-full">
      {/* Mobile view (< md): Vertical Timeline */}
      <div className="flex flex-col gap-6 md:hidden">
        {steps.map((step, index) => {
          const isCompleted = step.stepOrder < currentStepOrder;
          const isCurrent = step.stepOrder === currentStepOrder;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative flex gap-4">
              {/* Left track with Circle and Line */}
              <div className="flex shrink-0 flex-col items-center">
                <div
                  className={cn(
                    "bg-background z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500",
                    isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                    isCurrent && "bg-primary/20 ring-primary/20 border-primary text-primary animate-pulse ring-4",
                    !isCompleted && !isCurrent && "border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4.5 w-4.5" />
                  ) : (
                    <span className="text-xs font-bold">{step.stepOrder}</span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "mt-1 -mb-6 w-0.5 grow transition-all duration-700",
                      isCompleted ? "bg-emerald-500" : "bg-border"
                    )}
                    style={{ minHeight: "24px" }}
                  />
                )}
              </div>

              {/* Text info */}
              <div className="flex flex-col justify-center py-1">
                <span
                  className={cn(
                    "text-sm leading-tight font-semibold",
                    isCurrent ? "text-primary" : isCompleted ? "text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {step.stepName}
                </span>
                <span className="text-muted-foreground mt-0.5 text-xs">
                  Bước {step.stepOrder} · {step.stepOrder * 25}%
                </span>
                <span className="text-xs">
                  {step.startDate ? formatDate(step.startDate).split(" ")[1] : "--/--/----"} -{" "}
                  {step.endDate ? formatDate(step.endDate).split(" ")[1] : "--/--/----"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop view (>= md): Horizontal Timeline */}
      <div className="hidden items-center justify-between md:flex">
        {steps.map((step, index) => {
          const isCompleted = step.stepOrder < currentStepOrder;
          const isCurrent = step.stepOrder === currentStepOrder;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className={cn("flex items-center", !isLast && "flex-1")}>
              {/* Step Circle */}
              <div className="flex h-26 flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500",
                    isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                    isCurrent && "bg-primary/20 ring-primary/20 border-primary text-primary animate-pulse ring-4",
                    !isCompleted && !isCurrent && "border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-bold">{step.stepOrder}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 w-30 text-center text-xs leading-tight font-medium",
                    isCurrent ? "text-primary" : isCompleted ? "text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {step.stepName}
                </span>
                <span className="mt-2 text-xs">
                  {step.startDate ? formatDate(step.startDate).split(" ")[1] : "--/--/----"} -{" "}
                  {step.endDate ? formatDate(step.endDate).split(" ")[1] : "--/--/----"}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="mx-2 -mt-16 flex-1">
                  <div
                    className={cn(
                      "h-0.5 w-full transition-all duration-700",
                      isCompleted ? "bg-emerald-500" : "bg-border"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
