import { useEffect, useState } from "react";
import api from "../services/api";

interface KelasData {
  id: string;
  name: string;
  level: string;
  academicYear: string;
  status: string;
}

function Kelas() {
  const [kelas, setKelas] = useState<KelasData[]>([]);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  async function getKelas() {
    try {
      const response = await api.get("/classes");
      setKelas(response.data);
    } catch (error) {
      console.error("Gagal mengambil data kelas", error);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name || !level || !academicYear) {
      return;
    }

    setLoading(true);

    try {
      if (editId) {
        await api.put(`/classes/${editId}`, {
          name,
          level,
          academicYear,
        });
      } else {
        await api.post("/classes", {
          name,
          level,
          academicYear,
        });
      }

      setName("");
      setLevel("");
      setAcademicYear("");
      setEditId(null);

      await getKelas();
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "Gagal menyimpan data kelas"
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: KelasData) {
    setEditId(item.id);
    setName(item.name);
    setLevel(item.level);
    setAcademicYear(item.academicYear);
  }

  function cancelEdit() {
    setEditId(null);
    setName("");
    setLevel("");
    setAcademicYear("");
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus kelas ini?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/classes/${id}`);
      await getKelas();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "Gagal menghapus kelas"
      );
    }
  }

  useEffect(() => {
    getKelas();
  }, []);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Kelas
        </h1>

        <p className="mt-1 text-gray-500">
          Kelola data kelas sekolah
        </p>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          {editId ? "Edit Kelas" : "Tambah Kelas"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="Nama kelas"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <input
              type="text"
              placeholder="Tingkat"
              value={level}
              onChange={(event) =>
                setLevel(event.target.value)
              }
              className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <input
              type="text"
              placeholder="Tahun ajaran"
              value={academicYear}
              onChange={(event) =>
                setAcademicYear(event.target.value)
              }
              className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Menyimpan..."
                : editId
                  ? "Simpan Perubahan"
                  : "Tambah"}
            </button>

            {editId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg bg-gray-100 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-200"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Daftar Kelas
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama Kelas</th>
                <th className="px-6 py-4">Tingkat</th>
                <th className="px-6 py-4">Tahun Ajaran</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {kelas.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-600">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.level}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.academicYear}
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      {item.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-600 hover:bg-blue-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 font-medium text-red-600 hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {kelas.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Belum ada data kelas.
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

export default Kelas;