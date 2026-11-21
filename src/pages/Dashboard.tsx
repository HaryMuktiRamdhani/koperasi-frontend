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

// Warna aksen mengikuti pengaturan tampilan (Settings > Appearance).
const ACCENT = "var(--accent-color, #20b2aa)";

// Kartu memakai variabel tema dari index.css agar sama di light dan dark mode.
const cardClass =
  "rounded-2xl border border-(--app-border) bg-(--app-surface) shadow-sm";

type Tone = "teal" | "blue" | "sky";

const tones: Record<Tone, { tile: string; bar: string }> = {
  teal: {
    tile: "bg-teal-500/10 text-teal-600 dark:text-teal-300",
    bar: "bg-teal-500",
  },
  blue: {
    tile: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    bar: "bg-blue-500",
  },
  sky: {
    tile: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    bar: "bg-sky-500",
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

function StatCard({ label, value, icon: Icon, to, linkLabel, tone }: StatCardProps) {
  const style = tones[tone];

  return (
    <div className={`${cardClass} relative overflow-hidden p-5`}>
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${style.bar}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-(--app-muted)">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-(--app-text) tabular-nums">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.tile}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
      </div>
      <Link
        to={to}
        className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-(--app-primary) hover:underline"
      >
        {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function PaymentRing({ percentage }: { percentage: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
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
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight text-(--app-text)">
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

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className={`${cardClass} flex items-center gap-3 px-6 py-4`}>
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full bg-(--app-primary)"
          />
          <p className="text-sm text-(--app-muted)">{t("dashboard")}...</p>
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

  const summaryRows: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Siswa terdaftar", value: formatNumber(data.totalStudents), icon: Users },
    { label: "Barang tersedia", value: formatNumber(data.totalItems), icon: Package },
    { label: "Total tagihan", value: formatNumber(data.totalBills), icon: ReceiptText },
    { label: "Tagihan belum dibayar", value: formatNumber(data.unpaidBills), icon: Clock3 },
    { label: "Total pemasukan", value: formatCurrency(data.totalIncome), icon: Wallet },
  ];

  const quickActions: {
    to: string;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    tone: Tone;
  }[] = [
    { to: "/students", title: "Data Siswa", subtitle: "Kelola siswa", icon: Users, tone: "teal" },
    { to: "/items", title: "Data Barang", subtitle: "Kelola barang", icon: Package, tone: "blue" },
    { to: "/bills", title: "Tagihan", subtitle: "Kelola tagihan", icon: ReceiptText, tone: "sky" },
    { to: "/payments", title: "Pembayaran", subtitle: "Catat pembayaran", icon: Wallet, tone: "teal" },
  ];

  return (
    <div className="space-y-7">
      <section
        className="relative overflow-hidden rounded-3xl border border-white/10 p-6 text-white shadow-lg shadow-slate-900/10 sm:p-8"
        style={{
          backgroundImage: `radial-gradient(70% 140% at 100% 0%, color-mix(in srgb, ${ACCENT} 45%, transparent), transparent 65%), linear-gradient(135deg, #0f2a43 0%, #123a52 55%, #0f4c5c 100%)`,
        }}
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
              {t("schoolSystem")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              {t("dashboardSubtitle")}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur">
            <Activity className="h-3.5 w-3.5 text-teal-200" />
            {t("operationalData")}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          tone="blue"
        />
        <StatCard
          label={t("totalBills")}
          value={formatNumber(data.totalBills)}
          icon={ReceiptText}
          to="/bills"
          linkLabel={t("viewBills")}
          tone="sky"
        />

        {appearance.dashboardWidgets.cashSummary && (
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 p-5 text-white shadow-lg shadow-slate-900/10"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #102a43 0%, #12425a 60%, #0f5b66 100%)",
            }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full border border-white/10"
            />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-300">
                  {t("totalIncome")}
                </p>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-200">
                  <Wallet className="h-5 w-5" strokeWidth={1.9} />
                </span>
              </div>
              <p className="-mt-1 text-2xl font-semibold tracking-tight text-white tabular-nums">
                {formatCurrency(data.totalIncome)}
              </p>
            </div>
            <Link
              to="/payments"
              className="relative mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-teal-200 hover:text-white"
            >
              {t("viewPayments")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/40">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-sm font-medium">{t("paid")}</p>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-(--app-text) tabular-nums">
                    {formatNumber(data.paidBills)}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/70 dark:bg-amber-950/40">
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
                className="flex items-center justify-between gap-3 py-3"
              >
                <span className="flex items-center gap-3 text-sm text-(--app-muted)">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--app-primary-soft) text-(--app-primary)">
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
      <div className={`${cardClass} p-6`}>
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
              className="group flex items-center gap-3 rounded-xl border border-(--app-border) bg-(--app-surface-muted) p-4 hover:border-(--app-primary) hover:bg-(--app-primary-soft)"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[action.tone].tile}`}
              >
                <action.icon className="h-5 w-5" strokeWidth={1.9} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-(--app-text)">
                  {action.title}
                </p>

                <p className="mt-0.5 text-xs text-(--app-muted)">
                  {action.subtitle}
                </p>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-(--app-muted) group-hover:text-(--app-primary)" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;