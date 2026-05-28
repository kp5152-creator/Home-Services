import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

type FieldShellProps = {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
};

export function FieldShell({ label, children, hint, className }: FieldShellProps) {
  return (
    <label className={cn("grid gap-2 text-label text-ink", className)}>
      <span className="tracking-[0.01em]">{label}</span>
      {children}
      {hint ? <span className="text-xs font-semibold leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("field-shell w-full p-3 shadow-soft", className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field-shell w-full p-3 shadow-soft", className)} {...props} />;
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("field-shell w-full p-3 shadow-soft", className)} {...props} />;
}
