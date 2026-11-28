import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Package,
  ReceiptText,
  Wallet,
  ArrowRight,
  Activity,
  CheckCircle2,
  CircleAlert,
  Clock3,
  RefreshCw,
  Percent,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

interface DashboardData {
  totalStudents: number;
  totalItems: number;
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  totalIncome: number;
}

const ACCENT = "var(--accent-color, #20b2aa)";

/* ------------------------------------------------------------------ */
/* Animasi                                                             */
/* ------------------------------------------------------------------ */

/*
  Semua animasi ada di sini supaya file ini tetap single-file.
  Daftar animasi:
  1.  Fade Up          -> .um-fade-up
  2.  Fade In          -> .um-fade-in
  3.  Stagger          -> variabel --um-delay (hero, kartu, baris, dll)
  4.  Row Fade In      -> .um-row-in
  5.  Card Hover       -> .um-card
  6.  Row Hover        -> .um-row
  7.  Button Hover     -> .um-btn
  8.  Button Press     -> .um-btn:active (scale)
  9.  Input Focus      -> .um-input
  10. Badge Hover      -> .um-badge
  11. Loading Spinner  -> .um-spinner
  12. Reduced Motion   -> @media (prefers-reduced-motion: reduce)
  Tambahan: Alert Slide Down (.um-alert), Modal Backdrop (.um-backdrop),
  Modal Pop (.um-modal), Pulse teks loading (.um-pulse).

  Catatan: animasi masuk memakai fill-mode "backwards" (bukan "both"),
  supaya setelah selesai, efek hover (transform) tetap bisa jalan.
*/
const ANIMATION_CSS = `
.um-root {
  --um-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

/* 1. Fade Up */
@keyframes um-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
.um-fade-up {
  animation: um-fade-up 0.5s var(--um-ease) backwards;
  animation-delay: var(--um-delay, 0ms);
}

/* 2. Fade In */
@keyframes um-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.um-fade-in {
  animation: um-fade-in 0.4s ease-out backwards;
  animation-delay: var(--um-delay, 0ms);
}

/* 4. Row Fade In (dipakai bersama stagger lewat --um-delay) */
@keyframes um-row-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.um-row-in {
  animation: um-row-in 0.4s var(--um-ease) backwards;
  animation-delay: var(--um-delay, 0ms);
}

/* Alert / notice slide down */
@keyframes um-alert {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.um-alert {
  animation: um-alert 0.3s var(--um-ease) backwards;
}

/* Modal backdrop + pop */
@keyframes um-backdrop {
  from { opacity: 0; }
  to { opacity: 1; }
}
.um-backdrop {
  animation: um-backdrop 0.2s ease-out backwards;
}
@keyframes um-modal {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.um-modal {
  animation: um-modal 0.3s var(--um-ease) backwards;
}

/* 5. Card Hover */
.um-card {
  transition: transform 0.25s var(--um-ease), box-shadow 0.25s var(--um-ease),
    border-color 0.25s ease, background-color 0.25s ease;
}
@media (hover: hover) {
  .um-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 30px -14px rgba(15, 23, 42, 0.3);
  }
}

/* 6. Row Hover */
.um-row {
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}
@media (hover: hover) {
  .um-row:hover {
    box-shadow: inset 3px 0 0 #20b2aa;
  }
}

/* 7. Button Hover + 8. Button Press */
.um-btn {
  transition: transform 0.18s var(--um-ease), background-color 0.18s ease,
    box-shadow 0.18s ease, opacity 0.18s ease, border-color 0.18s ease;
}
@media (hover: hover) {
  .um-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px -6px rgba(22, 139, 135, 0.55);
  }
}
.um-btn:not(:disabled):active {
  transform: scale(0.95);
  box-shadow: none;
}
.um-btn:focus-visible {
  outline: 2px solid #20b2aa;
  outline-offset: 2px;
}

/* 9. Input Focus */
.um-input {
  transition: border-color 0.2s ease, box-shadow 0.2s ease,
    background-color 0.2s ease;
}
.um-input:focus {
  border-color: #20b2aa;
  box-shadow: 0 0 0 3px rgba(32, 178, 170, 0.22);
}

/* 10. Badge Hover */
.um-badge {
  transition: transform 0.2s var(--um-ease), box-shadow 0.2s ease,
    background-color 0.2s ease, border-color 0.2s ease;
}
@media (hover: hover) {
  .um-badge:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 10px -4px rgba(22, 139, 135, 0.5);
  }
}

/* 11. Loading Spinner */
@keyframes um-spin {
  to { transform: rotate(360deg); }
}
.um-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: um-spin 0.7s linear infinite;
}

/* Pulse teks loading */
@keyframes um-pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
.um-pulse {
  animation: um-pulse 1.4s ease-in-out infinite;
}

/* 12. Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .um-root *,
  .um-root *::before,
  .um-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
    scroll-behavior: auto !important;
  }
  .um-card:hover,
  .um-btn:hover,
  .um-btn:active,
  .um-badge:hover {
    transform: none !important;
  }
  .um-spinner {
    animation: none !important;
    border-right-color: currentColor;
    opacity: 0.6;
  }
}
`;

/* Stagger helper: delay naik per index, dibatasi supaya tidak kelamaan */
function stagger(index: number, base = 0, step = 80, max = 10): CSSProperties {
  return {
    "--um-delay": `${base + Math.min(index, max) * step}ms`,
  } as CSSProperties;
}

/*
  Persentase pembayaran yang jujur:
  - Jika ada tagihan lunas tapi pembulatan menjadi 0%, tampilkan 1%.
  - Jika masih ada tagihan belum lunas tapi pembulatan menjadi 100%,
    tampilkan 99%.
*/
function getPaymentPercentage(paid: number, total: number) {
  if (total <= 0) return 0;

  const rounded = Math.round((paid / total) * 100);

  if (paid > 0 && rounded === 0) return 1;
  if (paid < total && rounded === 100) return 99;

  return rounded;
}

const cardClass =
  "um-card rounded-2xl border border-(--app-border) bg-(--app-surface) shadow-sm hover:border-(--app-primary)";

type Tone = "teal";

const tones: Record<Tone, { tile: string; bar: string }> = {
  teal: {
    tile: "bg-teal-600/10 text-teal-700 dark:text-teal-300 transition-colors duration-300 group-hover:bg-teal-600/20",
    bar: "bg-teal-600",
  },
};

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  to: string;
  linkLabel: string;
  tone: Tone;
  delay?: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  to,
  linkLabel,
  tone,
  delay = 0,
}: StatCardProps) {
  const style = tones[tone];

  return (
    <div
      style={stagger(0, delay)}
      className={`${cardClass} um-fade-up group relative overflow-hidden p-5`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${style.bar} origin-left transition-transform duration-500 group-hover:scale-x-105`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-(--app-muted)">{label}</p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-(--app-text) tabular-nums transition-colors duration-300">
            {value}
          </p>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.tile}`}
        >
          <Icon
            className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
            strokeWidth={1.9}
          />
        </span>
      </div>

      <Link
        to={to}
        className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-(--app-primary) transition-colors duration-200 hover:underline"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function PaymentRing({ percentage }: { percentage: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  const safePercentage = Math.min(Math.max(percentage, 0), 100);

  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAnimated(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const offset = animated
    ? circumference - (safePercentage / 100) * circumference
    : circumference;

  return (
    <div className="um-badge relative h-40 w-40 shrink-0">
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="11"
          className="stroke-slate-200 dark:stroke-[#294254]"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          stroke={ACCENT}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition:
              "stroke-dashoffset 1200ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight text-(--app-text) tabular-nums">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

function Dashboard() {
  const { appearance } = useTheme();
  const { t, formatCurrency, formatNumber } = useLanguage();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Mencegah setState setelah halaman ditinggalkan.
  const mountedRef = useRef(true);

  async function getDashboard(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setHasError(false);

    try {
      const response = await api.get("/dashboard");

      if (!mountedRef.current) return;

      setData(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Gagal mengambil data dashboard", error);

      if (!mountedRef.current) return;

      setHasError(true);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    void getDashboard();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="um-root flex min-h-[70vh] items-center justify-center">
        <style>{ANIMATION_CSS}</style>
        <div
          className={`${cardClass} um-fade-in flex items-center gap-3 px-6 py-4`}
        >
          <span
            aria-hidden="true"
            className="um-spinner text-(--app-primary)"
          />
          <p className="um-pulse text-sm text-(--app-muted)">
            {t("dashboard")}...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="um-root">
        <style>{ANIMATION_CSS}</style>
        <div
          role="alert"
          className={`${cardClass} um-fade-up mx-auto max-w-xl p-8 text-center`}
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-300">
            <CircleAlert className="h-6 w-6" strokeWidth={1.8} />
          </span>

          <h2 className="mt-4 text-lg font-semibold text-(--app-text)">
            Data dashboard tidak dapat dimuat
          </h2>

          <p className="mt-2 text-sm text-(--app-muted)">
            Terjadi kendala saat mengambil data. Silakan coba lagi.
          </p>

          <button
            type="button"
            onClick={() => void getDashboard()}
            className="um-btn mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const showCashSummary = appearance.dashboardWidgets.cashSummary;
  const showChart = appearance.dashboardWidgets.chart;

  const paymentPercentage = getPaymentPercentage(
    data.paidBills,
    data.totalBills,
  );

  // Ringkasan fokus ke detail tagihan dan keuangan.
  // Total siswa, barang, dan tagihan sudah tampil di kartu statistik.
  const summaryRows: {
    label: string;
    value: string;
    icon: LucideIcon;
  }[] = [
    {
      label: "Total tagihan",
      value: formatNumber(data.totalBills),
      icon: ReceiptText,
    },
    {
      label: "Tagihan lunas",
      value: formatNumber(data.paidBills),
      icon: CheckCircle2,
    },
    {
      label: "Tagihan belum dibayar",
      value: formatNumber(data.unpaidBills),
      icon: Clock3,
    },
    {
      label: "Persentase tagihan lunas",
      value: `${paymentPercentage}%`,
      icon: Percent,
    },
  ];

  // Baris pemasukan ikut tersembunyi saat widget ringkasan kas dimatikan.
  if (showCashSummary) {
    summaryRows.push({
      label: "Total pemasukan",
      value: formatCurrency(data.totalIncome),
      icon: Wallet,
    });
  }

  const quickActions: {
    to: string;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    tone: Tone;
  }[] = [
    {
      to: "/students",
      title: "Data Siswa",
      subtitle: "Kelola siswa",
      icon: Users,
      tone: "teal",
    },
    {
      to: "/items",
      title: "Data Barang",
      subtitle: "Kelola barang",
      icon: Package,
      tone: "teal",
    },
    {
      to: "/bills",
      title: "Tagihan",
      subtitle: "Kelola tagihan",
      icon: ReceiptText,
      tone: "teal",
    },
    {
      to: "/payments",
      title: "Pembayaran",
      subtitle: "Catat pembayaran",
      icon: Wallet,
      tone: "teal",
    },
  ];

  // Kolom menyesuaikan jumlah kartu yang tampil.
  const statGridClass = showCashSummary
    ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";

  // Jika grafik dimatikan, ringkasan memakai lebar penuh.
  const detailGridClass = showChart
    ? "grid grid-cols-1 gap-6 lg:grid-cols-2"
    : "grid grid-cols-1 gap-6";

  return (
    <div className="um-root space-y-7">
      <style>{ANIMATION_CSS}</style>

      {/* Hero Section */}
      <section
        style={{
          ...stagger(0),
          backgroundImage:
            "linear-gradient(135deg, #115e59 0%, #0f766e 55%, #0d9488 100%)",
        }}
        className="um-card um-fade-up relative overflow-hidden rounded-3xl border border-teal-700/20 p-6 text-white shadow-sm shadow-teal-900/10 sm:p-8"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10"
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full border border-white/10"
        />

        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p
              style={stagger(1, 0, 90)}
              className="um-fade-up text-xs font-semibold uppercase tracking-[0.18em] text-teal-100"
            >
              {t("schoolSystem")}
            </p>

            <h1
              style={stagger(2, 0, 90)}
              className="um-fade-up mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              Dashboard
            </h1>

            <p
              style={stagger(3, 0, 90)}
              className="um-fade-up mt-2 max-w-xl text-sm leading-relaxed text-teal-50/85"
            >
              {t("dashboardSubtitle")}
            </p>
          </div>

          <div
            style={stagger(4, 0, 90)}
            className="um-fade-up flex flex-col items-start gap-2 sm:items-end"
          >
            <span className="um-badge inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur hover:border-white/40 hover:bg-white/20">
              <Activity className="h-3.5 w-3.5 text-teal-100" />
              {t("operationalData")}
            </span>

            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-xs text-teal-50/80">
                  Diperbarui{" "}
                  {lastUpdated.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}

              <button
                type="button"
                onClick={() => void getDashboard(true)}
                disabled={refreshing}
                aria-label="Muat ulang data dashboard"
                title="Muat ulang data"
                className="um-btn inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pesan error saat muat ulang gagal (data lama tetap ditampilkan) */}
      {hasError && (
        <div
          role="alert"
          className="um-alert flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 shrink-0" />
            Data terbaru gagal dimuat. Data yang tampil mungkin belum
            diperbarui.
          </span>

          <button
            type="button"
            onClick={() => void getDashboard(true)}
            disabled={refreshing}
            className="um-btn inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Coba lagi
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className={statGridClass}>
        <StatCard
          label={t("totalStudents")}
          value={formatNumber(data.totalStudents)}
          icon={Users}
          to="/students"
          linkLabel={t("viewStudents")}
          tone="teal"
          delay={120}
        />

        <StatCard
          label={t("totalItems")}
          value={formatNumber(data.totalItems)}
          icon={Package}
          to="/items"
          linkLabel={t("viewItems")}
          tone="teal"
          delay={200}
        />

        <StatCard
          label={t("totalBills")}
          value={formatNumber(data.totalBills)}
          icon={ReceiptText}
          to="/bills"
          linkLabel={t("viewBills")}
          tone="teal"
          delay={280}
        />

        {showCashSummary && (
          <div
            style={stagger(0, 360)}
            className={`${cardClass} um-fade-up group relative overflow-hidden p-5`}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full border border-teal-600/10 transition-transform duration-500 group-hover:scale-125"
            />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-(--app-muted)">
                  {t("totalIncome")}
                </p>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700 transition-colors duration-300 group-hover:bg-teal-600/20 dark:text-teal-300">
                  <Wallet
                    className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                    strokeWidth={1.9}
                  />
                </span>
              </div>

              <p className="mt-3 text-2xl font-semibold tracking-tight text-(--app-text) tabular-nums">
                {formatCurrency(data.totalIncome)}
              </p>
            </div>

            <Link
              to="/payments"
              className="relative mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-(--app-primary) hover:underline"
            >
              {t("viewPayments")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>

      {/* Payment Status and Summary */}
      <div className={detailGridClass}>
        {showChart && (
          <div
            style={stagger(0, 440)}
            className={`${cardClass} um-fade-up flex flex-col p-6`}
          >
            <div>
              <h2 className="text-base font-semibold text-(--app-text)">
                {t("paymentStatus")}
              </h2>

              <p className="mt-1 text-sm text-(--app-muted)">
                {t("paymentStatusDescription")}
              </p>
            </div>

            <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-6 sm:flex-row">
              <PaymentRing percentage={paymentPercentage} />

              <div className="grid w-full flex-1 grid-cols-2 gap-3 sm:grid-cols-1">
                <div
                  style={stagger(0, 600)}
                  className="um-card um-fade-up rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/40"
                >
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-sm font-medium">{t("paid")}</p>
                  </div>

                  <p className="mt-2 text-xl font-semibold text-(--app-text) tabular-nums">
                    {formatNumber(data.paidBills)}
                  </p>
                </div>

                <div
                  style={stagger(0, 680)}
                  className="um-card um-fade-up rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/70 dark:bg-amber-950/40"
                >
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <Clock3 className="h-4 w-4" />
                    <p className="text-sm font-medium">{t("unpaid")}</p>
                  </div>

                  <p className="mt-2 text-xl font-semibold text-(--app-text) tabular-nums">
                    {formatNumber(data.unpaidBills)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div
          style={stagger(0, 520)}
          className={`${cardClass} um-fade-up p-6`}
        >
          <h2 className="text-base font-semibold text-(--app-text)">
            {t("summary")}
          </h2>

          <p className="mt-1 text-sm text-(--app-muted)">
            {t("summaryDescription")}
          </p>

          <div className="mt-4 divide-y divide-(--app-border)">
            {summaryRows.map((row, index) => (
              <div
                key={row.label}
                style={stagger(index, 620, 70)}
                className="um-row um-row-in group/row flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-(--app-primary-soft)"
              >
                <span className="flex items-center gap-3 text-sm text-(--app-muted)">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--app-primary-soft) text-(--app-primary) transition-transform duration-300 group-hover/row:scale-110">
                    <row.icon className="h-4 w-4" strokeWidth={1.9} />
                  </span>

                  {row.label}
                </span>

                <span className="text-sm font-semibold text-(--app-text) tabular-nums">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={stagger(0, 700)}
        className={`${cardClass} um-fade-up p-6`}
      >
        <div>
          <h2 className="text-base font-semibold text-(--app-text)">
            Akses Cepat
          </h2>

          <p className="mt-1 text-sm text-(--app-muted)">
            Menu yang sering digunakan untuk mengelola koperasi.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link
              key={action.to}
              to={action.to}
              style={stagger(index, 780, 70)}
              className="um-card um-btn um-fade-up group flex items-center gap-3 rounded-xl border border-(--app-border) bg-(--app-surface-muted) p-4 hover:border-(--app-primary) hover:bg-(--app-primary-soft)"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[action.tone].tile}`}
              >
                <action.icon
                  className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={1.9}
                />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-(--app-text)">
                  {action.title}
                </p>

                <p className="mt-0.5 text-xs text-(--app-muted)">
                  {action.subtitle}
                </p>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-(--app-muted) transition-all duration-300 group-hover:translate-x-1 group-hover:text-(--app-primary)" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;