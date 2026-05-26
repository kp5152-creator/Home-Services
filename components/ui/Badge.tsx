import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "gold";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-success-soft text-sage-dark",
  success: "bg-success-soft text-sage-dark",
  warning: "bg-warning-soft text-[#7b5426]",
  danger: "bg-danger-soft text-danger",
  gold: "bg-warning-soft text-[#7b5426]"
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: { tone?: BadgeTone; children: ReactNode } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full px-3 text-xs font-extrabold",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
