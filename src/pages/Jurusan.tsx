import { useEffect, useState } from "react";
import api from "../services/api";

interface JurusanData {
  id: string;
  nama: string;
  kode: string;
  isActive: boolean;
}

function Jurusan() {
  const [jurusan, setJurusan] = useState<JurusanData[]>([]);
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [loading, setLoading] = useState(false);

  async function getJurusan() {
    try {
      const response = await api.get("/jurusan");
      setJurusan(response.data);
    } catch (error) {
      console.error("Gagal mengambil data jurusan", error);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!nama || !kode) {
      return;
    }

    setLoading(true);

    try {
      await api.post("/jurusan", {
        nama,
        kode,
      });

      setNama("");
      setKode("");

      await getJurusan();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Gagal menambahkan jurusan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus jurusan ini?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/jurusan/${id}`);
      await getJurusan();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menghapus jurusan");
    }
  }

  useEffect(() => {
    getJurusan();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Jurusan</h1>
        <p>Kelola data jurusan sekolah</p>
      </div>

      <div className="form-card">
        <h2>Tambah Jurusan</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Nama jurusan"
              value={nama}
              onChange={(event) => setNama(event.target.value)}
            />

            <input
              type="text"
              placeholder="Kode jurusan"
              value={kode}
              onChange={(event) => setKode(event.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Tambah"}
            </button>
          </div>
        </form>
      </div>

      <div className="table-card">
        <h2>Daftar Jurusan</h2>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama</th>
              <th>Kode</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {jurusan.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.nama}</td>
                <td>{item.kode}</td>
                <td>{item.isActive ? "Aktif" : "Nonaktif"}</td>
                <td>
                  <button onClick={() => handleDelete(item.id)}>
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Jurusan;