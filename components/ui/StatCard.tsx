import type { ReactNode } from "react";
import { cn } from "./cn";

type StatCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  className?: string;
};

export function StatCard({ label, value, detail, className }: StatCardProps) {
  return (
    <div className={cn("estate-card min-h-[74px] border-gold/20 bg-cream/90 p-4", className)}>
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.08em] text-gold">{label}</span>
      <strong className="font-serif text-xl font-semibold leading-tight text-ink">{value}</strong>
      {detail ? <p className="mt-1 text-xs font-semibold leading-5 text-muted">{detail}</p> : null}
    </div>
  );
}
