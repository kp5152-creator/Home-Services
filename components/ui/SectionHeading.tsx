import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  level?: "h1" | "h2" | "h3";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  level = "h2",
  className,
  ...props
}: SectionHeadingProps & HTMLAttributes<HTMLDivElement>) {
  const Heading = level;
  const headingClass = level === "h1" ? "text-3xl sm:text-5xl" : level === "h3" ? "text-lg" : "text-xl sm:text-2xl";

  return (
    <div className={cn("min-w-0", className)} {...props}>
      {eyebrow ? <p className="type-eyebrow mb-2">{eyebrow}</p> : null}
      <Heading className={cn("type-title", headingClass)}>{title}</Heading>
      {description ? <p className="type-body mt-2">{description}</p> : null}
    </div>
  );
}
