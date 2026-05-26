import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type PanelTone = "default" | "paper" | "ink" | "warning" | "danger";

const toneClasses: Record<PanelTone, string> = {
  default: "estate-panel",
  paper: "border border-line bg-paper shadow-soft",
  ink: "bg-ink text-white shadow-estate",
  warning: "border border-[#ead2a8] bg-warning-soft",
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
