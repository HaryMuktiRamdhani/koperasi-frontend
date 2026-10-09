
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
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
  const [fetching, setFetching] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function getJurusan() {
    try {
      const response = await api.get("/jurusan");
      setJurusan(response.data);
    } catch (error) {
      console.error("Gagal mengambil data jurusan", error);
      setErrorMessage("Data jurusan gagal dimuat. Silakan coba lagi.");
    } finally {
      setFetching(false);
    }
  }

  function resetForm() {
    setNama("");
    setKode("");
    setEditId(null);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const namaValue = nama.trim();
    const kodeValue = kode.trim().toUpperCase();

    if (!namaValue || !kodeValue) {
      setErrorMessage("Nama dan kode jurusan wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (editId) {
        await api.put(`/jurusan/${editId}`, {
          nama: namaValue,
          kode: kodeValue,
        });
        setSuccessMessage("Data jurusan berhasil diperbarui.");
      } else {
        await api.post("/jurusan", {
          nama: namaValue,
          kode: kodeValue,
        });
        setSuccessMessage("Jurusan berhasil ditambahkan.");
      }

      setNama("");
      setKode("");
      setEditId(null);
      await getJurusan();
    } catch (error: unknown) {
      console.error("Gagal menyimpan jurusan", error);

      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      setErrorMessage(
        apiError.response?.data?.message ||
          "Data jurusan gagal disimpan."
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: JurusanData) {
    setEditId(item.id);
    setNama(item.nama);
    setKode(item.kode);
    setErrorMessage("");
    setSuccessMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Yakin ingin menghapus jurusan ini?"
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.delete(`/jurusan/${id}`);

      if (editId === id) {
        resetForm();
      }

      setSuccessMessage("Jurusan berhasil dihapus.");
      await getJurusan();
    } catch (error: unknown) {
      console.error("Gagal menghapus jurusan", error);

      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      setErrorMessage(
        apiError.response?.data?.message ||
          "Jurusan gagal dihapus."
      );
    }
  }

  useEffect(() => {
    getJurusan();
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Data Jurusan
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola informasi jurusan yang terdaftar di sekolah.
          </p>
        </div>

        <div className="text-sm text-gray-500">
          Total{" "}
          <span className="font-semibold text-gray-900">
            {jurusan.length}
          </span>{" "}
          jurusan
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {successMessage}
        </div>
      )}

      {/* Form */}
      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {editId ? "Edit Jurusan" : "Tambah Jurusan"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {editId
                ? "Perbarui informasi jurusan."
                : "Masukkan nama dan kode jurusan baru."}
            </p>
          </div>

          {editId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
              Batal
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
            <div>
              <label
                htmlFor="nama-jurusan"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Nama Jurusan
              </label>
              <input
                id="nama-jurusan"
                type="text"
                placeholder="Contoh: Rekayasa Perangkat Lunak"
                value={nama}
                onChange={(event) => setNama(event.target.value)}
                required
                maxLength={100}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="kode-jurusan"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Kode Jurusan
              </label>
              <input
                id="kode-jurusan"
                type="text"
                placeholder="Contoh: RPL"
                value={kode}
                onChange={(event) => setKode(event.target.value)}
                required
                maxLength={20}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm uppercase text-gray-900 outline-none transition placeholder:normal-case placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editId ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {loading
                ? "Menyimpan..."
                : editId
                  ? "Simpan Perubahan"
                  : "Tambah Jurusan"}
            </button>
          </div>
        </form>
      </section>

      {/* Data table */}
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900">
            Daftar Jurusan
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Informasi jurusan yang tersimpan dalam sistem.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-600px text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-16 px-5 py-3.5 sm:px-6">No.</th>
                <th className="px-5 py-3.5 sm:px-6">Nama Jurusan</th>
                <th className="px-5 py-3.5 sm:px-6">Kode</th>
                <th className="px-5 py-3.5 sm:px-6">Status</th>
                <th className="px-5 py-3.5 text-right sm:px-6">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {fetching ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    Memuat data jurusan...
                  </td>
                </tr>
              ) : jurusan.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center"
                  >
                    <p className="font-medium text-gray-700">
                      Belum ada data jurusan
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Tambahkan jurusan melalui formulir di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                jurusan.map((item, index) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-gray-50/70"
                  >
                    <td className="px-5 py-4 text-gray-500 sm:px-6">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900 sm:px-6">
                      {item.nama}
                    </td>

                    <td className="px-5 py-4 sm:px-6">
                      <span className="inline-flex rounded border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-700">
                        {item.kode}
                      </span>
                    </td>

                    <td className="px-5 py-4 sm:px-6">
                      <span
                        className={
                          item.isActive
                            ? "inline-flex items-center gap-1.5 text-xs font-medium text-green-700"
                            : "inline-flex items-center gap-1.5 text-xs font-medium text-gray-500"
                        }
                      >
                        <span
                          className={
                            item.isActive
                              ? "h-1.5 w-1.5 rounded-full bg-green-600"
                              : "h-1.5 w-1.5 rounded-full bg-gray-400"
                          }
                        />
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          aria-label={`Edit ${item.nama}`}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Hapus ${item.nama}`}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!fetching && jurusan.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500 sm:px-6">
            Menampilkan {jurusan.length} data jurusan
          </div>
        )}
      </section>
    </div>
  );
}

export default Jurusan;