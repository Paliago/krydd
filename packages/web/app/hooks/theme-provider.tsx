import { createContext, type ReactNode, useCallback, useContext } from "react";
import { useFetcher } from "react-router";

const DEFAULT_THEME = "default";
const DEFAULT_MODE = "system";

type ThemeContextType = {
  activeTheme: string;
  setTheme: (newTheme: string, coords?: { x: number; y: number }) => void;
  mode: "light" | "dark" | "system";
  setMode: (
    newMode: "light" | "dark" | "system",
    coords?: { x: number; y: number },
  ) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  initialTheme,
  initialMode,
}: {
  children: ReactNode;
  initialTheme: string;
  initialMode: "light" | "dark" | "system";
}) {
  const fetcher = useFetcher();

  const startViewTransition = useCallback(
    (callback: () => void, coords?: { x: number; y: number }) => {
      const root = document.documentElement;

      if (!document.startViewTransition || !coords) {
        callback();
        return;
      }

      // Set the click coordinates for the animation
      root.style.setProperty("--x", `${coords.x}px`);
      root.style.setProperty("--y", `${coords.y}px`);

      // Start the view transition
      document.startViewTransition(callback);
    },
    [],
  );

  const handleSetTheme = useCallback(
    (newTheme: string, coords?: { x: number; y: number }) => {
      if (fetcher.state === "idle") {
        startViewTransition(() => {
          fetcher.submit(
            { theme: newTheme },
            {
              method: "post",
              action: "/set-theme",
              encType: "application/x-www-form-urlencoded",
            },
          );
        }, coords);
      }
    },
    [fetcher, startViewTransition],
  );

  const handleSetMode = useCallback(
    (
      newMode: "light" | "dark" | "system",
      coords?: { x: number; y: number },
    ) => {
      if (fetcher.state === "idle") {
        startViewTransition(() => {
          fetcher.submit(
            { mode: newMode },
            {
              method: "post",
              action: "/set-mode",
              encType: "application/x-www-form-urlencoded",
            },
          );
        }, coords);
      }
    },
    [fetcher, startViewTransition],
  );

  const contextValue = {
    activeTheme: initialTheme || DEFAULT_THEME,
    setTheme: handleSetTheme,
    mode: initialMode || DEFAULT_MODE,
    setMode: handleSetMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
