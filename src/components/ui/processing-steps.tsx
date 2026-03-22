"use client";

import { CheckCircle2, Loader2, Circle } from "lucide-react";

interface ProcessingStepsProps {
  currentStep: number;
  conceptCount: number;
}

const steps = [
  {
    label: "Analyzing your notes",
    description: "Finding key concepts with AI...",
  },
  {
    label: "Extracting concepts",
    descriptionFn: (n: number) =>
      n > 0
        ? `Found ${n} key concepts. Building lesson structure...`
        : "Identifying core concepts...",
  },
  {
    label: "Generating micro-lesson",
    description: "Creating segments, quizzes, and explanations...",
  },
];

export function ProcessingSteps({
  currentStep,
  conceptCount,
}: ProcessingStepsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold">Creating your lesson</h3>
        <p className="text-sm text-muted-foreground">
          This usually takes 10-20 seconds
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          const description =
            "descriptionFn" in step
              ? (
                  step as {
                    label: string;
                    descriptionFn: (n: number) => string;
                  }
                ).descriptionFn(conceptCount)
              : (step as { label: string; description: string }).description;

          return (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5">
                {isCompleted && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {isCurrent && (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                {isPending && (
                  <Circle className="w-5 h-5 text-muted-foreground/30" />
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    isCompleted
                      ? "text-green-600"
                      : isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-xs ${
                    isCurrent
                      ? "text-muted-foreground animate-step-pulse"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shimmer bar */}
      <div className="h-1.5 rounded-full animate-shimmer" />
    </div>
  );
}
