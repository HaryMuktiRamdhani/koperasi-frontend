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
        <p className="text-sm text-gray-500">Memuat dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Dashboard tidak dapat dimuat
        </h2>

        <p className="mt-2 text-sm text-gray-500">
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#168b87]">Ikhtisar operasional</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102a43]">Dashboard</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Pantau data utama koperasi sekolah dan status pembayaran dalam satu tampilan.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
          Data terhubung ke sistem
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Siswa</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#102a43]">{data.totalStudents}</p>
            </div>
            <span className="rounded-lg bg-[#e8f7f5] p-2.5 text-[#168b87]"><Users className="h-5 w-5" /></span>
          </div>
          <Link to="/students" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#168b87] hover:text-[#102a43]">Lihat data siswa <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Barang</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#102a43]">{data.totalItems}</p>
            </div>
            <span className="rounded-lg bg-amber-50 p-2.5 text-amber-600"><Package className="h-5 w-5" /></span>
          </div>
          <Link to="/items" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#168b87] hover:text-[#102a43]">Lihat data barang <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Tagihan</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#102a43]">{data.totalBills}</p>
            </div>
            <span className="rounded-lg bg-orange-50 p-2.5 text-orange-600"><ReceiptText className="h-5 w-5" /></span>
          </div>
          <Link to="/bills" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#168b87] hover:text-[#102a43]">Lihat tagihan <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-[#102a43] p-5 shadow-[0_4px_18px_rgba(16,42,67,0.08)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-300">Total Pemasukan</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">Rp {data.totalIncome.toLocaleString("id-ID")}</p>
            </div>
            <span className="rounded-lg bg-white/10 p-2.5 text-[#5ed5cc]"><Wallet className="h-5 w-5" /></span>
          </div>
          <Link to="/payments" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#5ed5cc] hover:text-white">Lihat pembayaran <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#102a43]">Status Pembayaran</h2>
              <p className="mt-1 text-sm text-slate-500">Persentase tagihan yang sudah diselesaikan.</p>
            </div>
            <span className="text-lg font-semibold text-[#168b87]">{paymentPercentage}%</span>
          </div>

          <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#20b2aa] transition-all duration-500"
              style={{
                width: `${paymentPercentage}%`,
              }}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /><p className="text-sm font-medium">Sudah Lunas</p></div>
              <p className="mt-2 text-xl font-semibold text-[#102a43]">{data.paidBills}</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-4">
              <div className="flex items-center gap-2 text-amber-700"><Clock3 className="h-4 w-4" /><p className="text-sm font-medium">Belum Bayar</p></div>
              <p className="mt-2 text-xl font-semibold text-[#102a43]">{data.unpaidBills}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
          <h2 className="text-base font-semibold text-[#102a43]">Ringkasan</h2>
          <p className="mt-1 text-sm text-slate-500">Informasi utama koperasi saat ini.</p>

          <div className="mt-5 divide-y divide-slate-100">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600">
                Siswa terdaftar
              </span>

              <span className="text-sm font-semibold text-[#102a43]">
                {data.totalStudents}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600">
                Barang tersedia
              </span>

              <span className="text-sm font-semibold text-[#102a43]">
                {data.totalItems}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600">
                Total tagihan
              </span>

              <span className="text-sm font-semibold text-[#102a43]">
                {data.totalBills}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600">
                Tagihan belum dibayar
              </span>

              <span className="text-sm font-semibold text-[#102a43]">
                {data.unpaidBills}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600">
                Total pemasukan
              </span>

              <span className="text-sm font-semibold text-[#102a43]">
                Rp {data.totalIncome.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_4px_18px_rgba(16,42,67,0.04)]">
        <div>
          <h2 className="text-base font-semibold text-[#102a43]">
            Akses Cepat
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Menu yang sering digunakan untuk mengelola koperasi.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/students"
            className="rounded-lg border border-slate-200 p-4 transition hover:border-[#20b2aa] hover:bg-[#f6fbfa]"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[#168b87]" />

              <div>
                <p className="text-sm font-medium text-[#102a43]">
                  Data Siswa
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Kelola siswa
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/items"
            className="rounded-lg border border-slate-200 p-4 transition hover:border-[#20b2aa] hover:bg-[#f6fbfa]"
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-[#168b87]" />

              <div>
                <p className="text-sm font-medium text-[#102a43]">
                  Data Barang
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Kelola barang
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/bills"
            className="rounded-lg border border-slate-200 p-4 transition hover:border-[#20b2aa] hover:bg-[#f6fbfa]"
          >
            <div className="flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-[#168b87]" />

              <div>
                <p className="text-sm font-medium text-[#102a43]">
                  Tagihan
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Kelola tagihan
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/payments"
            className="rounded-lg border border-slate-200 p-4 transition hover:border-[#20b2aa] hover:bg-[#f6fbfa]"
          >
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-[#168b87]" />

              <div>
                <p className="text-sm font-medium text-[#102a43]">
                  Pembayaran
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Catat pembayaran
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;