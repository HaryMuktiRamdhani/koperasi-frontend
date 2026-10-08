import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Package,
  ReceiptText,
  Wallet,
  ArrowRight,
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Ringkasan aktivitas koperasi sekolah.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Siswa */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Siswa</p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {data.totalStudents}
              </p>
            </div>

            <Users className="h-5 w-5 text-gray-400" />
          </div>

          <Link
            to="/students"
            className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            Lihat data siswa
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Total Barang */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Barang</p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {data.totalItems}
              </p>
            </div>

            <Package className="h-5 w-5 text-gray-400" />
          </div>

          <Link
            to="/items"
            className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            Lihat data barang
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Total Tagihan */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tagihan</p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {data.totalBills}
              </p>
            </div>

            <ReceiptText className="h-5 w-5 text-gray-400" />
          </div>

          <Link
            to="/bills"
            className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            Lihat tagihan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Pemasukan */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Pemasukan</p>

              <p className="mt-2 text-2xl font-semibold text-gray-900">
                Rp {data.totalIncome.toLocaleString("id-ID")}
              </p>
            </div>

            <Wallet className="h-5 w-5 text-gray-400" />
          </div>

          <Link
            to="/payments"
            className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            Lihat pembayaran
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status Pembayaran */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Status Pembayaran
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Persentase tagihan yang sudah diselesaikan.
              </p>
            </div>

            <span className="text-lg font-semibold text-gray-900">
              {paymentPercentage}%
            </span>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${paymentPercentage}%`,
              }}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-sm text-gray-500">
                Sudah Lunas
              </p>

              <p className="mt-1 text-xl font-semibold text-gray-900">
                {data.paidBills}
              </p>
            </div>

            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-sm text-gray-500">
                Belum Bayar
              </p>

              <p className="mt-1 text-xl font-semibold text-gray-900">
                {data.unpaidBills}
              </p>
            </div>
          </div>
        </div>

        {/* Ringkasan */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">
            Ringkasan
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Informasi utama koperasi saat ini.
          </p>

          <div className="mt-5 divide-y divide-gray-100">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-600">
                Siswa terdaftar
              </span>

              <span className="text-sm font-semibold text-gray-900">
                {data.totalStudents}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-600">
                Barang tersedia
              </span>

              <span className="text-sm font-semibold text-gray-900">
                {data.totalItems}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-600">
                Total tagihan
              </span>

              <span className="text-sm font-semibold text-gray-900">
                {data.totalBills}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-600">
                Tagihan belum dibayar
              </span>

              <span className="text-sm font-semibold text-gray-900">
                {data.unpaidBills}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-600">
                Total pemasukan
              </span>

              <span className="text-sm font-semibold text-gray-900">
                Rp {data.totalIncome.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Akses Cepat
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Menu yang sering digunakan untuk mengelola koperasi.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/students"
            className="rounded-md border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-500" />

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Data Siswa
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Kelola siswa
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/items"
            className="rounded-md border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-500" />

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Data Barang
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Kelola barang
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/bills"
            className="rounded-md border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <ReceiptText className="h-5 w-5 text-gray-500" />

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Tagihan
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Kelola tagihan
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/payments"
            className="rounded-md border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-gray-500" />

              <div>
                <p className="text-sm font-medium text-gray-900">
                  Pembayaran
                </p>

                <p className="mt-1 text-xs text-gray-500">
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