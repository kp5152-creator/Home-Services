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
  const headingClass =
    level === "h1" ? "font-serif text-4xl sm:text-6xl" : level === "h3" ? "text-lg" : "font-serif text-3xl sm:text-4xl";

  return (
    <div className={cn("min-w-0", className)} {...props}>
      {eyebrow ? <p className="type-eyebrow mb-2">{eyebrow}</p> : null}
      <Heading className={cn("type-title", headingClass)}>{title}</Heading>
      {description ? <p className="type-body mt-3 max-w-2xl">{description}</p> : null}
    </div>
  );
}
