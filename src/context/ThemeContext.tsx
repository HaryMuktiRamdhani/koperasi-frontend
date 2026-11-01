import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  getAppearanceSettings,
  resetAppearanceSettings,
  saveAppearanceSettings,
  type AppearanceSettings,
  type ThemeMode,
} from "../services/settingsStorage";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  appearance: AppearanceSettings;
  setTheme: (theme: ThemeMode) => void;
  updateAppearance: (changes: Partial<AppearanceSettings>) => void;
  resetAppearance: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(mode: ThemeMode): Theme {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyAppearance(settings: AppearanceSettings) {
  const theme = resolveTheme(settings.themeMode);
  const accentColors = {
    teal: "#20b2aa",
    blue: "#3b82f6",
    violet: "#8b5cf6",
    amber: "#f59e0b",
  } as const;
  const fontSizes = { small: "14px", medium: "16px", large: "18px" } as const;
  const fontFamilies = { system: "ui-sans-serif, system-ui, sans-serif", monospace: "ui-monospace, SFMono-Regular, monospace", serif: "ui-serif, Georgia, serif" } as const;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  document.body.classList.toggle("bg-[#f5f7fa]", theme === "light");
  document.body.classList.toggle("text-[#102a43]", theme === "light");
  document.body.classList.toggle("dark:bg-[#0b1220]", theme === "dark");
  document.body.classList.toggle("dark:text-slate-100", theme === "dark");
  document.documentElement.dataset.accent = settings.accent;
  document.documentElement.classList.toggle("high-contrast", settings.highContrast);
  document.documentElement.classList.toggle("focus-visible-outline", settings.focusOutline);
  document.documentElement.classList.toggle("highlight-links", settings.highlightLinks);
  document.documentElement.dataset.density = settings.density;
  document.documentElement.dataset.contentWidth = settings.contentWidth;
  document.documentElement.dataset.fontSize = settings.fontSize;
  document.documentElement.dataset.fontFamily = settings.fontFamily;
  document.documentElement.style.setProperty("--accent-color", accentColors[settings.accent]);
  document.body.style.fontSize = fontSizes[settings.fontSize];
  document.body.style.fontFamily = fontFamilies[settings.fontFamily];
  document.documentElement.style.setProperty("--focus-outline-width", settings.focusOutline ? "3px" : "0px");
  document.documentElement.style.setProperty("--contrast-multiplier", settings.highContrast ? "1.15" : "1");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<AppearanceSettings>(getAppearanceSettings);
  const theme = resolveTheme(appearance.themeMode);

  useEffect(() => {
    applyAppearance(appearance);
    saveAppearanceSettings(appearance);
  }, [appearance]);

  useEffect(() => {
    if (appearance.themeMode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyAppearance(appearance);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [appearance]);

  const value = useMemo(
    () => ({
      theme,
      themeMode: appearance.themeMode,
      appearance,
      setTheme: (themeMode: ThemeMode) => setAppearance((current) => ({ ...current, themeMode })),
      updateAppearance: (changes: Partial<AppearanceSettings>) => setAppearance((current) => ({ ...current, ...changes })),
      resetAppearance: () => setAppearance(resetAppearanceSettings()),
    }),
    [appearance, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme harus digunakan di dalam ThemeProvider.");
  }

  return context;
}
