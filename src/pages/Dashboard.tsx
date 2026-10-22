import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Package,
  ReceiptText,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import api from "../services/api";

interface DashboardData {
  totalStudents: number;
  totalItems: number;
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  totalIncome: number;
}

function Dashboard() {
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
        <p className="text-sm text-gray-500 dark:text-[#a7b4c7]">Memuat dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          Dashboard tidak dapat dimuat
        </h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-[#a7b4c7]">
          Silakan coba muat ulang halaman.
        </p>
      </div>
    );
  }

  const paymentPercentage =
    data.totalBills > 0
      ? Math.round((data.paidBills / data.totalBills) * 100)
      : 0;

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#168b87]">
            Sistem Informasi Sekolah
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102a43] dark:text-slate-100">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-[#a7b4c7]">
            Pantau data utama koperasi sekolah dan status pembayaran dalam satu
            tampilan.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-[#a7b4c7]">
          Data Operasional Sekolah
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-5 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-[#a7b4c7]">Total Siswa</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#102a43] dark:text-slate-100">
                {data.totalStudents}
              </p>
            </div>
            <span className="rounded-lg bg-[#e8f7f5] dark:bg-[#1b2a3d] p-2.5 text-[#168b87]">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <Link
            to="/students"
            className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-[#168b87] hover:text-[#102a43] dark:hover:text-[#5eead4]"
          >
            Lihat data siswa <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-5 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-[#a7b4c7]">Total Barang</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#102a43] dark:text-slate-100">
                {data.totalItems}
              </p>
            </div>
            <span className="rounded-lg bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
              <Package className="h-5 w-5" />
            </span>
          </div>
          <Link
            to="/items"
            className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-[#168b87] hover:text-[#102a43] dark:hover:text-[#5eead4]"
          >
            Lihat data barang <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-5 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-[#a7b4c7]">Total Tagihan</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#102a43] dark:text-slate-100">
                {data.totalBills}
              </p>
            </div>
            <span className="rounded-lg bg-orange-50 p-2.5 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
              <ReceiptText className="h-5 w-5" />
            </span>
          </div>
          <Link
            to="/bills"
            className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-[#168b87] hover:text-[#102a43] dark:hover:text-[#5eead4]"
          >
            Lihat tagihan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#263449] bg-[#102a43] p-5 shadow-[0_4px_18px_rgba(16,42,67,0.08)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-300">Total Pemasukan</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Rp {data.totalIncome.toLocaleString("id-ID")}
              </p>
            </div>
            <span className="rounded-lg bg-white/10 p-2.5 text-[#5ed5cc]">
              <Wallet className="h-5 w-5" />
            </span>
          </div>
          <Link
            to="/payments"
            className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-[#5ed5cc] hover:text-white dark:hover:text-[#d5fffb]"
          >
            Lihat pembayaran <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#102a43] dark:text-slate-100">
                Status Pembayaran
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
                Persentase tagihan yang sudah diselesaikan.
              </p>
            </div>
            <span className="text-lg font-semibold text-[#168b87]">
              {paymentPercentage}%
            </span>
          </div>

          <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-[#20b2aa] transition-all duration-500"
              style={{
                width: `${paymentPercentage}%`,
              }}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/70 dark:bg-emerald-950/40 p-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-medium">Sudah Lunas</p>
              </div>
              <p className="mt-2 text-xl font-semibold text-[#102a43] dark:text-slate-100">
                {data.paidBills}
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 dark:border-amber-900/70 dark:bg-amber-950/40 p-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Clock3 className="h-4 w-4" />
                <p className="text-sm font-medium">Belum Bayar</p>
              </div>
              <p className="mt-2 text-xl font-semibold text-[#102a43] dark:text-slate-100">
                {data.unpaidBills}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <h2 className="text-base font-semibold text-[#102a43] dark:text-slate-100">Ringkasan</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
            Informasi utama koperasi saat ini.
          </p>

          <div className="mt-5 divide-y divide-slate-100 dark:divide-[#263449]">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600 dark:text-[#a7b4c7]">Siswa terdaftar</span>

              <span className="text-sm font-semibold text-[#102a43] dark:text-slate-100">
                {data.totalStudents}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600 dark:text-[#a7b4c7]">Barang tersedia</span>

              <span className="text-sm font-semibold text-[#102a43] dark:text-slate-100">
                {data.totalItems}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600 dark:text-[#a7b4c7]">Total tagihan</span>

              <span className="text-sm font-semibold text-[#102a43] dark:text-slate-100">
                {data.totalBills}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600 dark:text-[#a7b4c7]">
                Tagihan belum dibayar
              </span>

              <span className="text-sm font-semibold text-[#102a43] dark:text-slate-100">
                {data.unpaidBills}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600 dark:text-[#a7b4c7]">Total pemasukan</span>

              <span className="text-sm font-semibold text-[#102a43] dark:text-slate-100">
                Rp {data.totalIncome.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
        <div>
          <h2 className="text-base font-semibold text-[#102a43] dark:text-slate-100">
            Akses Cepat
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-[#a7b4c7]">
            Menu yang sering digunakan untuk mengelola koperasi.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/students"
            className="rounded-lg border border-slate-200 dark:border-[#263449] p-4 transition hover:border-[#20b2aa] hover:bg-[#f6fbfa] dark:hover:bg-[#162b3d]"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[#168b87]" />

              <div>
                <p className="text-sm font-medium text-[#102a43] dark:text-slate-100">Data Siswa</p>

                <p className="mt-1 text-xs text-slate-500 dark:text-[#a7b4c7]">Kelola siswa</p>
              </div>
            </div>
          </Link>

          <Link
            to="/items"
            className="rounded-lg border border-slate-200 dark:border-[#263449] p-4 transition hover:border-[#20b2aa] hover:bg-[#f6fbfa] dark:hover:bg-[#162b3d]"
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-[#168b87]" />

              <div>
                <p className="text-sm font-medium text-[#102a43] dark:text-slate-100">
                  Data Barang
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-[#a7b4c7]">Kelola barang</p>
              </div>
            </div>
          </Link>

          <Link
            to="/bills"
            className="rounded-lg border border-slate-200 dark:border-[#263449] p-4 transition hover:border-[#20b2aa] hover:bg-[#f6fbfa] dark:hover:bg-[#162b3d]"
          >
            <div className="flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-[#168b87]" />

              <div>
                <p className="text-sm font-medium text-[#102a43] dark:text-slate-100">Tagihan</p>

                <p className="mt-1 text-xs text-slate-500 dark:text-[#a7b4c7]">Kelola tagihan</p>
              </div>
            </div>
          </Link>

          <Link
            to="/payments"
            className="rounded-lg border border-slate-200 dark:border-[#263449] p-4 transition hover:border-[#20b2aa] hover:bg-[#f6fbfa] dark:hover:bg-[#162b3d]"
          >
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-[#168b87]" />

              <div>
                <p className="text-sm font-medium text-[#102a43] dark:text-slate-100">Pembayaran</p>

                <p className="mt-1 text-xs text-slate-500 dark:text-[#a7b4c7]">Catat pembayaran</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
