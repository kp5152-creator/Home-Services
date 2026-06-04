import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type PanelTone = "default" | "paper" | "ink" | "warning" | "danger";

const toneClasses: Record<PanelTone, string> = {
  default: "estate-panel",
  paper: "border border-gold/20 bg-cream/90 shadow-soft",
  ink: "border border-gold/20 bg-ink text-white shadow-estate",
  warning: "border border-gold/20 bg-[#eae4d8]",
  danger: "border border-[#e7cbc4] bg-danger-soft text-danger"
};

export function Panel({
  tone = "default",
  className,
  children,
  ...props
}: { tone?: PanelTone; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("rounded-estate", toneClasses[tone], className)} {...props}>
      {children}
    </section>
  );
}
