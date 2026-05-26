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
    <div className={cn("estate-card min-h-[74px] p-4", className)}>
      <span className="mb-2 block text-xs font-extrabold uppercase text-slate-600">{label}</span>
      <strong className="text-ink">{value}</strong>
      {detail ? <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p> : null}
    </div>
  );
}
