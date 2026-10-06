import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function getDashboard() {
      try {
        const response = await api.get("/dashboard");
        setData(response.data);
      } catch (error) {
        console.error("Gagal mengambil dashboard", error);
      } finally {
        setLoading(false);
      }
    }

    getDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <p className="text-gray-500">Memuat dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <p className="text-gray-500">
          Data dashboard tidak tersedia.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-gray-500">
          Ringkasan data koperasi sekolah
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <span className="mb-3 block text-sm text-gray-500">
            Total Siswa
          </span>

          <strong className="text-3xl font-bold text-gray-900">
            {data.totalStudents}
          </strong>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <span className="mb-3 block text-sm text-gray-500">
            Total Barang
          </span>

          <strong className="text-3xl font-bold text-gray-900">
            {data.totalItems}
          </strong>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <span className="mb-3 block text-sm text-gray-500">
            Total Tagihan
          </span>

          <strong className="text-3xl font-bold text-gray-900">
            {data.totalBills}
          </strong>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <span className="mb-3 block text-sm text-gray-500">
            Tagihan Lunas
          </span>

          <strong className="text-3xl font-bold text-green-600">
            {data.paidBills}
          </strong>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <span className="mb-3 block text-sm text-gray-500">
            Belum Bayar
          </span>

          <strong className="text-3xl font-bold text-red-600">
            {data.unpaidBills}
          </strong>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <span className="mb-3 block text-sm text-gray-500">
            Total Pemasukan
          </span>

          <strong className="text-3xl font-bold text-gray-900">
            Rp {data.totalIncome.toLocaleString("id-ID")}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;