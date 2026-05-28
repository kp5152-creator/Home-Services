import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "gold";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border border-gold/20 bg-cream/80 text-charcoal",
  success: "border border-gold/25 bg-success-soft text-ink",
  warning: "border border-gold/35 bg-warning-soft text-[#7b5426]",
  danger: "border border-[#e7cbc4] bg-danger-soft text-danger",
  gold: "border border-gold/40 bg-[linear-gradient(135deg,#f2d98a,#d4af37)] text-ink shadow-button"
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
        "inline-flex min-h-8 items-center rounded-full px-3 text-xs font-extrabold shadow-soft",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
