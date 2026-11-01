const PREFIX = "koperasi.settings.";

export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "teal" | "blue" | "violet" | "amber";
export type Density = "comfortable" | "compact" | "dense";
export type ContentWidth = "full" | "centered";
export type FontSize = "small" | "medium" | "large";
export type FontFamily = "system" | "monospace" | "serif";

export interface AppearanceSettings {
  themeMode: ThemeMode;
  accent: AccentColor;
  highContrast: boolean;
  compactSidebar: boolean;
  autoHideSidebar: boolean;
  showBreadcrumb: boolean;
  showSearch: boolean;
  showWorkspaceCard: boolean;
  density: Density;
  contentWidth: ContentWidth;
  fontSize: FontSize;
  fontFamily: FontFamily;
  focusOutline: boolean;
  highlightLinks: boolean;
  zebraRows: boolean;
  stickyTableHeader: boolean;
  showRowNumbers: boolean;
  defaultPageSize: number;
  dashboardWidgets: {
    cashSummary: boolean;
    chart: boolean;
    dueBills: boolean;
    lowStock: boolean;
    recentActivity: boolean;
  };
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  themeMode: "light",
  accent: "teal",
  highContrast: false,
  compactSidebar: false,
  autoHideSidebar: false,
  showBreadcrumb: true,
  showSearch: true,
  showWorkspaceCard: true,
  density: "comfortable",
  contentWidth: "full",
  fontSize: "medium",
  fontFamily: "system",
  focusOutline: true,
  highlightLinks: false,
  zebraRows: false,
  stickyTableHeader: false,
  showRowNumbers: true,
  defaultPageSize: 10,
  dashboardWidgets: {
    cashSummary: true,
    chart: true,
    dueBills: true,
    lowStock: true,
    recentActivity: true,
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getAppearanceSettings(): AppearanceSettings {
  const storedAppearance = localStorage.getItem(`${PREFIX}appearance`);
  const legacyTheme = localStorage.getItem("theme");
  const stored = storedAppearance
    ? getLocalSetting<unknown>("appearance", DEFAULT_APPEARANCE)
    : {
        ...DEFAULT_APPEARANCE,
        themeMode: legacyTheme === "dark" || legacyTheme === "light" ? legacyTheme : DEFAULT_APPEARANCE.themeMode,
      };
  if (!isObject(stored)) return DEFAULT_APPEARANCE;
  const dashboardWidgets = isObject(stored.dashboardWidgets) ? stored.dashboardWidgets : {};
  return {
    ...DEFAULT_APPEARANCE,
    ...stored,
    themeMode: ["light", "dark", "system"].includes(String(stored.themeMode)) ? stored.themeMode as ThemeMode : DEFAULT_APPEARANCE.themeMode,
    accent: ["teal", "blue", "violet", "amber"].includes(String(stored.accent)) ? stored.accent as AccentColor : DEFAULT_APPEARANCE.accent,
    density: ["comfortable", "compact", "dense"].includes(String(stored.density)) ? stored.density as Density : DEFAULT_APPEARANCE.density,
    contentWidth: stored.contentWidth === "centered" ? "centered" : "full",
    fontSize: ["small", "medium", "large"].includes(String(stored.fontSize)) ? stored.fontSize as FontSize : DEFAULT_APPEARANCE.fontSize,
    fontFamily: ["system", "monospace", "serif"].includes(String(stored.fontFamily)) ? stored.fontFamily as FontFamily : DEFAULT_APPEARANCE.fontFamily,
    defaultPageSize: [10, 25, 50].includes(Number(stored.defaultPageSize)) ? Number(stored.defaultPageSize) : DEFAULT_APPEARANCE.defaultPageSize,
    dashboardWidgets: { ...DEFAULT_APPEARANCE.dashboardWidgets, ...dashboardWidgets },
  };
}

export function saveAppearanceSettings(settings: AppearanceSettings): void {
  setLocalSetting("appearance", settings);
}

export function resetAppearanceSettings(): AppearanceSettings {
  setLocalSetting("appearance", DEFAULT_APPEARANCE);
  return DEFAULT_APPEARANCE;
}

export function getLocalSetting<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(`${PREFIX}${key}`);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function setLocalSetting<T>(key: string, value: T): void {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export function removeLocalSetting(key: string): void {
  localStorage.removeItem(`${PREFIX}${key}`);
}
