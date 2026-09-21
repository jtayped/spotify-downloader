import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-4 [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        neutral: "border-line bg-surface text-ink-muted",
        accent: "border-accent/30 bg-accent-wash text-accent-text",
        danger: "border-danger/30 bg-danger-wash text-danger-text",
        outline: "border-line-strong bg-transparent text-ink-subtle",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
