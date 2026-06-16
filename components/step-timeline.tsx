import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  stepName: string;
  stepOrder: number;
}

interface StepTimelineProps {
  steps: Step[];
  currentStepOrder: number;
}

export function StepTimeline({ steps, currentStepOrder }: StepTimelineProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.stepOrder < currentStepOrder;
          const isCurrent = step.stepOrder === currentStepOrder;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className={cn("flex items-center", !isLast && "flex-1")}>
              {/* Step Circle */}
              <div className="flex h-20 flex-col items-center">
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
                    "mt-2 w-25 text-center text-xs leading-tight font-medium",
                    isCurrent ? "text-primary" : isCompleted ? "text-emerald-400" : "text-muted-foreground"
                  )}
                >
                  {step.stepName}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="mx-2 -mt-8 flex-1">
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
