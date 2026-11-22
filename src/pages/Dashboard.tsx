
import { useEffect, useState } from "react";
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

const cardClass =
  "rounded-2xl border border-(--app-border) bg-(--app-surface) shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[var(--app-primary)] hover:shadow-lg hover:shadow-teal-900/5 motion-reduce:transition-none";

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
}

function StatCard({
  label,
  value,
  icon: Icon,
  to,
  linkLabel,
  tone,
}: StatCardProps) {
  const style = tones[tone];

  return (
    <div className={`${cardClass} group relative overflow-hidden p-5`}>
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${style.bar} origin-left transition-transform duration-500 group-hover:scale-x-105`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-(--app-muted)">
            {label}
          </p>

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
    <div className="relative h-40 w-40 shrink-0 transition-transform duration-300 hover:scale-105 motion-reduce:transition-none">
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
  const [pageVisible, setPageVisible] = useState(false);

  async function getDashboard() {
    try {
      const response = await api.get("/dashboard");
      setData(response.data);
    } catch (error) {
      console.error("Gagal mengambil data dashboard", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getDashboard();
  }, []);

  // Animasi masuk setelah data dashboard selesai dimuat.
  useEffect(() => {
    if (loading || !data) return;

    const frame = requestAnimationFrame(() => {
      setPageVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [loading, data]);

  const revealStyle = (delay = 0) => ({
    opacity: pageVisible ? 1 : 0,
    transform: pageVisible ? "translateY(0)" : "translateY(12px)",
    transitionDelay: `${delay}ms`,
  });

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className={`${cardClass} flex items-center gap-3 px-6 py-4`}>
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 animate-pulse rounded-full bg-(--app-primary)"
          />
          <p className="text-sm text-(--app-muted)">
            {t("dashboard")}...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`${cardClass} mx-auto max-w-xl p-8 text-center`}>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-300">
          <CircleAlert className="h-6 w-6" strokeWidth={1.8} />
        </span>

        <h2 className="mt-4 text-lg font-semibold text-(--app-text)">
          {t("dashboard")} unavailable
        </h2>

        <p className="mt-2 text-sm text-(--app-muted)">
          Silakan coba muat ulang halaman.
        </p>
      </div>
    );
  }

  const paymentPercentage =
    data.totalBills > 0
      ? Math.round((data.paidBills / data.totalBills) * 100)
      : 0;

  const summaryRows: {
    label: string;
    value: string;
    icon: LucideIcon;
  }[] = [
    {
      label: "Siswa terdaftar",
      value: formatNumber(data.totalStudents),
      icon: Users,
    },
    {
      label: "Barang tersedia",
      value: formatNumber(data.totalItems),
      icon: Package,
    },
    {
      label: "Total tagihan",
      value: formatNumber(data.totalBills),
      icon: ReceiptText,
    },
    {
      label: "Tagihan belum dibayar",
      value: formatNumber(data.unpaidBills),
      icon: Clock3,
    },
    {
      label: "Total pemasukan",
      value: formatCurrency(data.totalIncome),
      icon: Wallet,
    },
  ];

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

  return (
    <div className="space-y-7">
      {/* Hero Section */}
      <section
        style={{
          ...revealStyle(0),
          backgroundImage:
            "linear-gradient(135deg, #115e59 0%, #0f766e 55%, #0d9488 100%)",
        }}
        className="relative overflow-hidden rounded-3xl border border-teal-700/20 p-6 text-white shadow-sm shadow-teal-900/10 transition-[opacity,transform,box-shadow] duration-500 ease-out hover:shadow-lg hover:shadow-teal-900/15 motion-reduce:transition-none sm:p-8"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10 transition-transform duration-700 hover:scale-110"
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full border border-white/10"
        />

        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">
              {t("schoolSystem")}
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-teal-50/85">
              {t("dashboardSubtitle")}
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur transition-all duration-300 hover:border-white/40 hover:bg-white/20">
            <Activity className="h-3.5 w-3.5 text-teal-100" />
            {t("operationalData")}
          </span>
        </div>
      </section>

      {/* Statistics Cards */}
      <div
        style={revealStyle(100)}
        className="grid grid-cols-1 gap-4 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none md:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label={t("totalStudents")}
          value={formatNumber(data.totalStudents)}
          icon={Users}
          to="/students"
          linkLabel={t("viewStudents")}
          tone="teal"
        />

        <StatCard
          label={t("totalItems")}
          value={formatNumber(data.totalItems)}
          icon={Package}
          to="/items"
          linkLabel={t("viewItems")}
          tone="teal"
        />

        <StatCard
          label={t("totalBills")}
          value={formatNumber(data.totalBills)}
          icon={ReceiptText}
          to="/bills"
          linkLabel={t("viewBills")}
          tone="teal"
        />

        {appearance.dashboardWidgets.cashSummary && (
          <div
            className={`${cardClass} group relative overflow-hidden p-5`}
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
      <div
        style={revealStyle(200)}
        className="grid grid-cols-1 gap-6 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none lg:grid-cols-2"
      >
        {appearance.dashboardWidgets.chart && (
          <div className={`${cardClass} flex flex-col p-6`}>
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
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-emerald-900/70 dark:bg-emerald-950/40 motion-reduce:transition-none">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-sm font-medium">{t("paid")}</p>
                  </div>

                  <p className="mt-2 text-xl font-semibold text-(--app-text) tabular-nums">
                    {formatNumber(data.paidBills)}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-amber-900/70 dark:bg-amber-950/40 motion-reduce:transition-none">
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
        <div className={`${cardClass} p-6`}>
          <h2 className="text-base font-semibold text-(--app-text)">
            {t("summary")}
          </h2>

          <p className="mt-1 text-sm text-(--app-muted)">
            {t("summaryDescription")}
          </p>

          <div className="mt-4 divide-y divide-(--app-border)">
            {summaryRows.map((row) => (
              <div
                key={row.label}
                className="group/row flex items-center justify-between gap-3 rounded-lg py-3 transition-colors duration-200 hover:bg-(--app-primary-soft)"
              >
                <span className="flex items-center gap-3 text-sm text-(--app-muted)">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--app-primary-soft) text-(--app-primary) transition-transform duration-300 group-hover/row:scale-110">
                    <row.icon
                      className="h-4 w-4"
                      strokeWidth={1.9}
                    />
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
        style={revealStyle(300)}
        className={`${cardClass} p-6 transition-[opacity,transform,box-shadow] duration-500 ease-out motion-reduce:transition-none`}
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
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-center gap-3 rounded-xl border border-(--app-border) bg-(--app-surface-muted) p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-(--app-primary) hover:bg-(--app-primary-soft) hover:shadow-md motion-reduce:transition-none"
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
