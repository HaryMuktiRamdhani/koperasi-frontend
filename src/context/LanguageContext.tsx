import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_LANGUAGE_SETTINGS,
  getLanguageSettings,
  saveLanguageSettings,
  type LanguageSettings,
} from "../services/languageStorage";

type TranslationKey = keyof typeof translations.id;

const translations = {
  id: {
    settings: "Pengaturan",
    settingsDescription: "Kelola preferensi dan konfigurasi aplikasi.",
    language: "Bahasa & Regional",
    languageDescription: "Pilih bahasa yang digunakan di aplikasi.",
    profile: "Profil",
    dashboard: "Dashboard",
    logout: "Keluar",
    users: "Pengguna",
    students: "Siswa",
    items: "Barang",
    bills: "Tagihan",
    payments: "Pembayaran",
    classes: "Kelas",
    majors: "Jurusan",
    search: "Cari menu...",
    dashboardSubtitle:
      "Pantau data utama koperasi sekolah dan status pembayaran dalam satu tampilan.",
    schoolSystem: "Sistem Informasi Sekolah",
    operationalData: "Data Operasional Sekolah",
    totalStudents: "Total Siswa",
    totalItems: "Total Barang",
    totalBills: "Total Tagihan",
    totalIncome: "Total Pemasukan",
    viewStudents: "Lihat data siswa",
    viewItems: "Lihat data barang",
    viewBills: "Lihat tagihan",
    viewPayments: "Lihat pembayaran",
    paymentStatus: "Status Pembayaran",
    paymentStatusDescription: "Persentase tagihan yang sudah diselesaikan.",
    paid: "Sudah Lunas",
    unpaid: "Belum Bayar",
    summary: "Ringkasan",
    summaryDescription: "Informasi utama koperasi saat ini.",
    settingsLanguageHint: "Perubahan diterapkan langsung ke seluruh aplikasi.",
    appLanguage: "Bahasa aplikasi",
    indonesia: "Bahasa Indonesia",
    english: "English",
    timeZone: "Zona waktu",
    dateFormat: "Format tanggal",
    numberFormat: "Format angka",
    currency: "Mata uang",
    hourCycle: "Format jam",
    weekStart: "Hari pertama dalam minggu",
    monday: "Senin",
    sunday: "Minggu",
    shortDate: "Singkat",
    longDate: "Panjang",
    numericDate: "Numerik",
    indonesianNumber: "Indonesia (1.234,56)",
    englishNumber: "English (1,234.56)",
    rupiah: "Rupiah (IDR)",
    usDollar: "Dolar AS (USD)",
    hour24: "24 jam",
    hour12: "12 jam",
    languageSaved: "Preferensi bahasa tersimpan di perangkat ini.",
  },
  en: {
    settings: "Settings",
    settingsDescription: "Manage application preferences and configuration.",
    language: "Language & Regional",
    languageDescription: "Choose the language used in the application.",
    profile: "Profile",
    dashboard: "Dashboard",
    logout: "Log out",
    users: "Users",
    students: "Students",
    items: "Items",
    bills: "Bills",
    payments: "Payments",
    classes: "Classes",
    majors: "Majors",
    search: "Search menu...",
    dashboardSubtitle:
      "Monitor key school cooperative data and payment status in one view.",
    schoolSystem: "School Information System",
    operationalData: "School Operational Data",
    totalStudents: "Total Students",
    totalItems: "Total Items",
    totalBills: "Total Bills",
    totalIncome: "Total Income",
    viewStudents: "View students",
    viewItems: "View items",
    viewBills: "View bills",
    viewPayments: "View payments",
    paymentStatus: "Payment Status",
    paymentStatusDescription: "Percentage of bills that have been settled.",
    paid: "Paid",
    unpaid: "Unpaid",
    summary: "Summary",
    summaryDescription: "Key cooperative information at this time.",
    settingsLanguageHint:
      "Changes are applied immediately throughout the application.",
    appLanguage: "Application language",
    indonesia: "Bahasa Indonesia",
    english: "English",
    timeZone: "Time zone",
    dateFormat: "Date format",
    numberFormat: "Number format",
    currency: "Currency",
    hourCycle: "Time format",
    weekStart: "First day of week",
    monday: "Monday",
    sunday: "Sunday",
    shortDate: "Short",
    longDate: "Long",
    numericDate: "Numeric",
    indonesianNumber: "Indonesia (1.234,56)",
    englishNumber: "English (1,234.56)",
    rupiah: "Indonesian rupiah (IDR)",
    usDollar: "US dollar (USD)",
    hour24: "24-hour",
    hour12: "12-hour",
    languageSaved: "Language preference is saved on this device.",
  },
} as const;

interface LanguageContextValue {
  settings: LanguageSettings;
  updateLanguage: (changes: Partial<LanguageSettings>) => void;
  t: (key: TranslationKey) => string;
  formatNumber: (value: number) => string;
  formatCurrency: (value: number) => string;
  formatDate: (value: Date | string | number) => string;
  formatDateTime: (value: Date | string | number) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function toDate(value: Date | string | number): Date {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(getLanguageSettings);
  const updateLanguage = (changes: Partial<LanguageSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...changes };
      saveLanguageSettings(next);
      return next;
    });
  };
  const value = useMemo<LanguageContextValue>(() => {
    const locale = settings.language === "id" ? "id-ID" : "en-US";
    const numberLocale = settings.numberFormat === "id" ? "id-ID" : "en-US";
    const dateOptions: Intl.DateTimeFormatOptions =
      settings.dateFormat === "short"
        ? { day: "2-digit", month: "2-digit", year: "2-digit" }
        : settings.dateFormat === "long"
          ? { day: "2-digit", month: "long", year: "numeric" }
          : { day: "numeric", month: "numeric", year: "numeric" };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: settings.hourCycle === "12",
    };
    return {
      settings,
      updateLanguage,
      t: (key) => translations[settings.language][key] || translations.id[key],
      formatNumber: (value) =>
        new Intl.NumberFormat(numberLocale).format(value),
      formatCurrency: (value) =>
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency: settings.currency,
          maximumFractionDigits: settings.currency === "IDR" ? 0 : 2,
        }).format(value),
      formatDate: (value) =>
        new Intl.DateTimeFormat(locale, {
          ...dateOptions,
          timeZone: settings.timeZone,
        }).format(toDate(value)),
      formatDateTime: (value) =>
        new Intl.DateTimeFormat(locale, {
          ...dateOptions,
          ...timeOptions,
          timeZone: settings.timeZone,
        }).format(toDate(value)),
    };
  }, [settings]);
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage harus digunakan di dalam LanguageProvider.");
  return context;
}

export { DEFAULT_LANGUAGE_SETTINGS };
