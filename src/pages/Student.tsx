import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";

interface SiswaData {
  id: string;
  nis: string;
  name: string;
  classId: string;
  jurusanId: string;
  generation: string;
  status: string;
  Class?: {
    id: string;
    name: string;
    level: string;
    academicYear: string;
  };
  Jurusan?: {
    id: string;
    nama: string;
    kode: string;
  };
}

interface KelasData {
  id: string;
  name: string;
  level: string;
  academicYear: string;
}

interface JurusanData {
  id: string;
  nama: string;
  kode: string;
}

function Student() {
  const [siswa, setSiswa] = useState<SiswaData[]>([]);
  const [kelas, setKelas] = useState<KelasData[]>([]);
  const [jurusan, setJurusan] = useState<JurusanData[]>([]);

  const [nis, setNis] = useState("");
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [jurusanId, setJurusanId] = useState("");
  const [generation, setGeneration] = useState("");

  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  async function getSiswa() {
    try {
      const response = await api.get("/students");
      setSiswa(response.data);
    } catch (error) {
      console.error("Gagal mengambil data siswa", error);
    }
  }

  async function getKelas() {
    try {
      const response = await api.get("/classes");
      setKelas(response.data);
    } catch (error) {
      console.error("Gagal mengambil data kelas", error);
    }
  }

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

    if (!nis || !name || !classId || !jurusanId || !generation) {
      alert("Data siswa belum lengkap");
      return;
    }

    setLoading(true);

    try {
      const data = {
        nis,
        name,
        classId,
        jurusanId,
        generation,
      };

      if (editId) {
        await api.put(`/students/${editId}`, data);
      } else {
        await api.post("/students", data);
      }

      resetForm();
      await getSiswa();
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Gagal menyimpan data siswa"
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: SiswaData) {
    setEditId(item.id);
    setNis(item.nis);
    setName(item.name);
    setClassId(item.classId);
    setJurusanId(item.jurusanId);
    setGeneration(item.generation);
  }

  function resetForm() {
    setEditId(null);
    setNis("");
    setName("");
    setClassId("");
    setJurusanId("");
    setGeneration("");
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus siswa ini?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/students/${id}`);
      await getSiswa();
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Gagal menghapus siswa"
      );
    }
  }

  useEffect(() => {
    getSiswa();
    getKelas();
    getJurusan();
  }, []);

  return (
    <div>
      <PageHeader title="Siswa" description="Kelola data siswa sekolah" icon={Users} />

      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          {editId ? "Edit Siswa" : "Tambah Siswa"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="NIS"
              value={nis}
              onChange={(event) => setNis(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <input
              type="text"
              placeholder="Nama siswa"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Pilih kelas</option>

              {kelas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.academicYear}
                </option>
              ))}
            </select>

            <select
              value={jurusanId}
              onChange={(event) =>
                setJurusanId(event.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Pilih jurusan</option>

              {jurusan.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama} ({item.kode})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Angkatan"
              value={generation}
              onChange={(event) =>
                setGeneration(event.target.value)
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
                onClick={resetForm}
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
            Daftar Siswa
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">NIS</th>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Jurusan</th>
                <th className="px-6 py-4">Angkatan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {siswa.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-600">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.nis}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.Class?.name || "-"}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.Jurusan?.kode || "-"}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.generation}
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

              {siswa.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Belum ada data siswa.
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

export default Student;