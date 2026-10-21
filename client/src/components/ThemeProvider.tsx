import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getWhopTheme, onWhopThemeChange, isWhopIframeEnabled } from "@/lib/whop-iframe";

function getUrlThemePreference(): "light" | "dark" | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const theme = params.get("theme") || params.get("appearance");
    if (theme === "light" || theme === "dark") return theme;
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashTheme = hashParams.get("theme") || hashParams.get("appearance");
      if (hashTheme === "light" || hashTheme === "dark") return hashTheme;
    }
  } catch {}
  return null;
}

function getCookieThemePreference(): "light" | "dark" | null {
  try {
    const cookies = document.cookie.split(";");
    const themeCookie = cookies.find((c) => c.trim().startsWith("whop-frosted-theme="));
    if (themeCookie) {
      const val = themeCookie.split("=")[1]?.trim();
      if (val === "light" || val === "dark") return val;
    }
  } catch {}
  return null;
}

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): "light" | "dark" {
  return getUrlThemePreference() || getCookieThemePreference() || getSystemPreference();
}

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme?: () => void;
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
  const [theme, setTheme] = useState<"light" | "dark">(() => getInitialTheme());
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    // 1. Fetch initial theme from Whop SDK
    getWhopTheme().then((whopTheme) => {
      if (whopTheme) setTheme(whopTheme);
    });

    // 2. Real-time events from Whop SDK
    const unsubscribeWhop = onWhopThemeChange((newTheme) => {
      setTheme(newTheme);
    });

    // 3. 1-second polling fallback (SDK -> Cookie -> URL)
    const pollInterval = setInterval(async () => {
      const polledWhopTheme = await getWhopTheme();
      if (polledWhopTheme && polledWhopTheme !== themeRef.current) {
        setTheme(polledWhopTheme);
        return;
      }
      const cookieTheme = getCookieThemePreference();
      if (cookieTheme && cookieTheme !== themeRef.current) {
        setTheme(cookieTheme);
        return;
      }
      const urlTheme = getUrlThemePreference();
      if (urlTheme && urlTheme !== themeRef.current) {
        setTheme(urlTheme);
        return;
      }
    }, 1000);

    // 4. OS preference fallback when outside Whop iframe
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (!isWhopIframeEnabled) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      unsubscribeWhop();
      clearInterval(pollInterval);
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, []);

  // Apply theme class to HTML and Root
  useEffect(() => {
    const root = document.documentElement;
    const rootDiv = document.getElementById("root");
    if (theme === "dark") {
      root.classList.add("dark");
      rootDiv?.classList.add("dark");
    } else {
      root.classList.remove("dark");
      rootDiv?.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
