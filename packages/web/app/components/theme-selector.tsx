import { CheckIcon } from "lucide-react";
import * as React from "react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { useTheme } from "~/hooks/theme-provider";
import { baseColors } from "~/lib/colors";
import { cn } from "~/lib/utils";

export function ThemeSelector() {
  const { activeTheme, setTheme, mode } = useTheme();

  const handleThemeChange = (e: React.MouseEvent, themeName: string) => {
    setTheme(themeName, { x: e.clientX, y: e.clientY });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize</CardTitle>
        <CardDescription>Select a theme for the website.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs mb-2">Color</Label>
          <div className="flex flex-col gap-2">
            {baseColors.map((color) => {
              const isActive = activeTheme === color.name;

              return (
                <Button
                  variant={"outline"}
                  size="sm"
                  key={color.name}
                  onClick={(e) => handleThemeChange(e, color.name)}
                  className={cn(
                    "justify-start",
                    isActive && "border-primary dark:border-primary border-2",
                  )}
                  style={
                    {
                      "--theme-primary": `${
                        color?.activeColor[mode === "dark" ? "dark" : "light"]
                      }`,
                    } as React.CSSProperties
                  }
                >
                  <span
                    className={cn(
                      "mr-1 flex size-5 shrink-0 -translate-x-1 items-center justify-center rounded-full bg-[var(--theme-primary)]",
                    )}
                  >
                    {isActive && <CheckIcon className="size-4 text-white" />}
                  </span>
                  {color.label}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
