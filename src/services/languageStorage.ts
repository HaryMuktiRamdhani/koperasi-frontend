const KEY = "koperasi.settings.language";

export type AppLanguage = "id" | "en";
export type TimeZone = "Asia/Jakarta" | "Asia/Makassar" | "Asia/Jayapura" | "UTC";
export type DateFormat = "short" | "long" | "numeric";
export type NumberFormat = "id" | "en";
export type Currency = "IDR" | "USD";
export type HourCycle = "24" | "12";
export type WeekStart = "monday" | "sunday";

export interface LanguageSettings {
  language: AppLanguage;
  timeZone: TimeZone;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  currency: Currency;
  hourCycle: HourCycle;
  weekStart: WeekStart;
}

export const DEFAULT_LANGUAGE_SETTINGS: LanguageSettings = {
  language: "id",
  timeZone: "Asia/Jakarta",
  dateFormat: "numeric",
  numberFormat: "id",
  currency: "IDR",
  hourCycle: "24",
  weekStart: "monday",
};

const isValue = <T extends string>(value: unknown, values: readonly T[]): value is T =>
  typeof value === "string" && values.includes(value as T);

export function getLanguageSettings(): LanguageSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_LANGUAGE_SETTINGS;
    const value = JSON.parse(raw) as Partial<LanguageSettings>;
    return {
      language: isValue(value.language, ["id", "en"]) ? value.language : DEFAULT_LANGUAGE_SETTINGS.language,
      timeZone: isValue(value.timeZone, ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "UTC"]) ? value.timeZone : DEFAULT_LANGUAGE_SETTINGS.timeZone,
      dateFormat: isValue(value.dateFormat, ["short", "long", "numeric"]) ? value.dateFormat : DEFAULT_LANGUAGE_SETTINGS.dateFormat,
      numberFormat: isValue(value.numberFormat, ["id", "en"]) ? value.numberFormat : DEFAULT_LANGUAGE_SETTINGS.numberFormat,
      currency: isValue(value.currency, ["IDR", "USD"]) ? value.currency : DEFAULT_LANGUAGE_SETTINGS.currency,
      hourCycle: isValue(value.hourCycle, ["24", "12"]) ? value.hourCycle : DEFAULT_LANGUAGE_SETTINGS.hourCycle,
      weekStart: isValue(value.weekStart, ["monday", "sunday"]) ? value.weekStart : DEFAULT_LANGUAGE_SETTINGS.weekStart,
    };
  } catch {
    return DEFAULT_LANGUAGE_SETTINGS;
  }
}

export function saveLanguageSettings(settings: LanguageSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

