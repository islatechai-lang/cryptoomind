import { createContext, useContext, useEffect, useState } from "react";
import { whopIframeSdk } from "@/lib/whop-iframe";

const MANUAL_THEME_KEY = "manual-theme-preference";

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  resetToAuto: () => void;
  isManual: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Clear any old manual override so Whop mode preference always takes priority
  try {
    localStorage.removeItem(MANUAL_THEME_KEY);
  } catch (e) {
    // Ignore storage errors
  }

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return getSystemPreference();
  });

  const applyTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  useEffect(() => {
    // 1. Apply initial theme
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // 2. Listen for Whop's Frosted UI theme events
    const handleFrostedTheme = (e: Event) => {
      const customEvent = e as CustomEvent<{ appearance?: "light" | "dark" }>;
      const appearance = customEvent.detail?.appearance;
      if (appearance === "light" || appearance === "dark") {
        applyTheme(appearance);
      }
    };

    root.addEventListener("frosted-ui:set-theme", handleFrostedTheme);

    // 3. Query Whop SDK for current theme on mount
    if (whopIframeSdk) {
      try {
        (whopIframeSdk as any).getColorTheme?.().then((res: any) => {
          if (res?.appearance === "light" || res?.appearance === "dark") {
            applyTheme(res.appearance);
          }
        }).catch(() => null);
      } catch (err) {
        console.warn("Failed to get color theme from Whop SDK:", err);
      }
      // Notify Whop iframe SDK that Frosted UI is mounted to trigger initial theme sync
      root.dispatchEvent(new CustomEvent("frosted-ui:mounted"));
    }

    // 4. Fallback: Listen for system preference changes if outside Whop
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      root.removeEventListener("frosted-ui:set-theme", handleFrostedTheme);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    applyTheme(next);
  };

  const resetToAuto = () => {
    applyTheme(getSystemPreference());
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, resetToAuto, isManual: false }}>
      {children}
    </ThemeContext.Provider>
  );
}
