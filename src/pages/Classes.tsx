import { useEffect, useState } from "react";
import api from "../services/api";

interface kelasData {
  id: string;
  nama: string;
  jurusanId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function kelas() {
  const [kelas, setKelas] = useState<kelasData[]>([]);
  async function getClasses() {
    try {
      const response = await api.get("classes");
      setKelas(response.data);
    } catch (error) {
      console.error("Gagal mengambil data kelas", error);
    }
  }

  useEffect(() => {
    getClasses();
  }, []);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold  text-blue-500">KELAS</h1>
        <p className="text-gray-600 font-bold mt-1">Daftar nama kelas</p>
      </div>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-gray-600">Total kelas: {kelas.length}</p>
      </div>
    </div>
    
  );
}
export default kelas;
