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
  const [editId, setEditId] = useState<string | null>(null);

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

    if (editId) {
      await handleEdit(event);
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
      alert(
        error.response?.data?.message ||
          "Gagal menambahkan jurusan"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(event: React.FormEvent) {
    event.preventDefault();

    if (!nama || !kode || !editId) {
      return;
    }

    setLoading(true);

    try {
      await api.put(`/jurusan/${editId}`, {
        nama,
        kode,
      });

      setNama("");
      setKode("");
      setEditId(null);
      await getJurusan();
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "Gagal mengubah jurusan"
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: JurusanData) {
    setEditId(item.id);
    setNama(item.nama);
    setKode(item.kode);
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
      alert(
        error.response?.data?.message ||
          "Gagal menghapus jurusan"
      );
    }
  }

  useEffect(() => {
    getJurusan();
  }, []);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Jurusan
        </h1>

        <p className="mt-1 text-gray-500">
          Kelola data jurusan sekolah
        </p>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          {editId ? "Edit Jurusan" : "Tambah Jurusan"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              placeholder="Nama jurusan"
              value={nama}
              onChange={(event) =>
                setNama(event.target.value)
              }
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <input
              type="text"
              placeholder="Kode jurusan"
              value={kode}
              onChange={(event) =>
                setKode(event.target.value)
              }
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Menyimpan..."
                : editId
                  ? "Simpan Perubahan"
                  : "Tambah"}
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Daftar Jurusan
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {jurusan.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-600">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.nama}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.kode}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.isActive
                        ? "Aktif"
                        : "Nonaktif"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(item.id)
                        }
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {jurusan.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Belum ada data jurusan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Jurusan;