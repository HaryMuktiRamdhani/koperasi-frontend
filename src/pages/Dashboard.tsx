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
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getDashboard() {
      try {
        const response = await api.get("/dashboard");

        setData(response.data);
      } catch (error) {
        console.error(
          "Gagal mengambil dashboard",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    getDashboard();
  }, []);

  if (loading) {
    return <p>Memuat dashboard...</p>;
  }

  if (!data) {
    return <p>Data dashboard tidak tersedia.</p>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Ringkasan data koperasi sekolah
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Siswa</span>
          <strong>{data.totalStudents}</strong>
        </div>

        <div className="stat-card">
          <span>Total Barang</span>
          <strong>{data.totalItems}</strong>
        </div>

        <div className="stat-card">
          <span>Total Tagihan</span>
          <strong>{data.totalBills}</strong>
        </div>

        <div className="stat-card">
          <span>Tagihan Lunas</span>
          <strong>{data.paidBills}</strong>
        </div>

        <div className="stat-card">
          <span>Belum Bayar</span>
          <strong>{data.unpaidBills}</strong>
        </div>

        <div className="stat-card">
          <span>Total Pemasukan</span>
          <strong>
            Rp {data.totalIncome.toLocaleString("id-ID")}
          </strong>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;