"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

const ORDER = ["system", "light", "dark"] as const;
const LABEL = { system: "system theme", light: "light theme", dark: "dark theme" };

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Before mount the resolved theme is unknown; render the frame so the bar
  // does not reflow, but keep it inert.
  if (!mounted) {
    return <div className="size-8" aria-hidden />;
  }

  const active = (ORDER as readonly string[]).includes(theme ?? "")
    ? (theme as (typeof ORDER)[number])
    : "system";
  const Icon = active === "light" ? Sun : active === "dark" ? Moon : Monitor;

  return (
    <Tooltip label={LABEL[active]}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`${LABEL[active]}. change theme`}
        onClick={() =>
          setTheme(ORDER[(ORDER.indexOf(active) + 1) % ORDER.length]!)
        }
      >
        <Icon />
      </Button>
    </Tooltip>
  );
}

export { ThemeToggle };
