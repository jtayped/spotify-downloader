"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "border-line bg-raised data-[state=checked]:bg-accent data-[state=checked]:border-accent",
        "peer inline-flex h-[20px] w-[34px] shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-150 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "bg-canvas pointer-events-none block size-[14px] rounded-full ring-0",
          "translate-x-[3px] transition-transform duration-150 ease-out data-[state=checked]:translate-x-[17px]",
          "data-[state=checked]:bg-accent-ink",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
