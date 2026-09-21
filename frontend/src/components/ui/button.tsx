import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap",
    "font-medium outline-none transition-[background-color,border-color,color,opacity] duration-150 ease-out",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-ink hover:bg-accent-hover active:bg-accent-hover font-semibold",
        secondary:
          "bg-surface text-ink border border-line hover:bg-raised hover:border-line-strong",
        ghost: "text-ink-muted hover:bg-raised hover:text-ink",
        danger:
          "bg-danger-wash text-danger-text border border-danger/25 hover:border-danger/45",
        link: "text-accent-text h-auto p-0 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-sm px-2.5 text-[13px]",
        md: "h-9 rounded-md px-3.5 text-[13px]",
        lg: "h-11 rounded-lg px-5 text-sm",
        icon: "size-9 rounded-md",
        "icon-sm": "size-8 rounded-sm",
        "icon-lg": "size-11 rounded-lg",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
