import { useEffect, useState } from "react";
import {
  GraduationCap,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import ConfirmModal from "../components/ConfirmModal";
import { getStoredRole } from "../utils/permissions";

type StatusJurusan = "Aktif" | "Nonaktif" | "Akan Datang";

interface JurusanData {
  id: string;
  nama: string;
  kode: string;
  status?: StatusJurusan;
  isActive?: boolean;
}

const STATUS_OPTIONS: StatusJurusan[] = ["Aktif", "Nonaktif", "Akan Datang"];

function getItemStatus(item: JurusanData): StatusJurusan {
  return item.status || (item.isActive === false ? "Nonaktif" : "Aktif");
}

function Jurusan() {
  const canManage = getStoredRole() === "admin";

  const [jurusan, setJurusan] = useState<JurusanData[]>([]);
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [status, setStatus] = useState<StatusJurusan>("Aktif");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Semua" | StatusJurusan>(
    "Semua",
  );

  const keyword = searchQuery.trim().toLowerCase();

  const filteredJurusan = jurusan.filter((item) => {
    const matchSearch =
      !keyword ||
      item.nama.toLowerCase().includes(keyword) ||
      item.kode.toLowerCase().includes(keyword);

    const matchStatus =
      statusFilter === "Semua" || getItemStatus(item) === statusFilter;

    return matchSearch && matchStatus;
  });

  const isFiltering = keyword !== "" || statusFilter !== "Semua";

  function resetFilter() {
    setSearchQuery("");
    setStatusFilter("Semua");
  }

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
    setStatus("Aktif");
    setEditId(null);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
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
          status,
        });

        setSuccessMessage("Data jurusan berhasil diperbarui.");
      } else {
        await api.post("/jurusan", {
          nama: namaValue,
          kode: kodeValue,
          status,
        });

        setSuccessMessage("Jurusan berhasil ditambahkan.");
      }

      setNama("");
      setKode("");
      setStatus("Aktif");
      setEditId(null);
      setShowForm(false);

      await getJurusan();
    } catch (error: unknown) {
      console.error("Gagal menyimpan jurusan", error);

      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      setErrorMessage(
        apiError.response?.data?.message || "Data jurusan gagal disimpan.",
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: JurusanData) {
    setEditId(item.id);
    setNama(item.nama);
    setKode(item.kode);
    setStatus(getItemStatus(item));
    setErrorMessage("");
    setSuccessMessage("");
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete() {
    if (!deleteId || deleteLoading) return;

    setDeleteLoading(true);

    const id = deleteId;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.delete(`/jurusan/${id}`);

      if (editId === id) {
        closeForm();
      }

      setSuccessMessage("Jurusan berhasil dihapus.");
      setDeleteId(null);

      await getJurusan();
    } catch (error: unknown) {
      console.error("Gagal menghapus jurusan", error);

      const apiError = error as {
        response?: { data?: { message?: string } };
      };

      const message =
        apiError.response?.data?.message || "Jurusan gagal dihapus.";

      setErrorMessage(message);
      setDeleteError(message);
    } finally {
      setDeleteLoading(false);
    }
  }

  useEffect(() => {
    getJurusan();
  }, []);

  return (
    <div className="jurusan-page mx-auto w-full max-w-7xl space-y-6">

      <style>{`
        @keyframes jurusanFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes jurusanFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .jurusan-page {
          animation: jurusanFadeUp 0.45s ease-out both;
        }

        .jurusan-section {
          animation: jurusanFadeUp 0.5s ease-out both;
        }

        .jurusan-row {
          animation: jurusanFadeIn 0.35s ease-out both;
          transition:
            background-color 180ms ease,
            box-shadow 180ms ease;
        }

        .jurusan-row:hover {
          background-color: rgb(20 184 166 / 0.055);
        }

        .dark .jurusan-row:hover {
          background-color: rgb(20 184 166 / 0.09);
        }

        .jurusan-card {
          transition:
            border-color 200ms ease,
            box-shadow 200ms ease,
            transform 200ms ease;
        }

        .jurusan-card:hover {
          border-color: rgb(20 184 166 / 0.35);
          box-shadow: 0 8px 24px rgb(15 23 42 / 0.055);
        }

        .dark .jurusan-card:hover {
          border-color: rgb(45 212 191 / 0.25);
          box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
        }

        .jurusan-control {
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease;
        }

        .jurusan-control:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgb(20 184 166 / 0.13);
        }

        .jurusan-button {
          transition:
            background-color 180ms ease,
            color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .jurusan-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .jurusan-button:active:not(:disabled) {
          transform: scale(0.97);
        }

        .jurusan-badge {
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .jurusan-badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgb(15 23 42 / 0.07);
        }

        @media (prefers-reduced-motion: reduce) {
          .jurusan-page,
          .jurusan-section,
          .jurusan-row {
            animation: none !important;
          }

          .jurusan-card,
          .jurusan-control,
          .jurusan-button,
          .jurusan-badge,
          .jurusan-row {
            transition: none !important;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Data Jurusan"
          description="Kelola informasi jurusan yang terdaftar di sekolah."
          icon={GraduationCap}
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-[#a7b4c7]">
            Total{" "}
            <span className="font-semibold text-gray-900 dark:text-slate-100 tabular-nums">
              {jurusan.length}
            </span>{" "}
            jurusan
          </div>

          {canManage && !showForm && (
            <button
              type="button"
              onClick={openAddForm}
              className="jurusan-button inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-600/15 hover:bg-teal-700 hover:shadow-md hover:shadow-teal-600/20"
            >
              <Plus className="h-4 w-4" />
              Tambah Jurusan
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div
          role="alert"
          className="jurusan-section rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="jurusan-section rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {successMessage}
        </div>
      )}

      {/* Form (hanya tampil setelah klik Tambah Jurusan / Edit) */}
      {canManage && showForm && (
        <section className="jurusan-section jurusan-card overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-[#263449] dark:bg-[#111c2e]">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-[#263449] sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                {editId ? "Edit Jurusan" : "Tambah Jurusan"}
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-[#a7b4c7]">
                {editId
                  ? "Perbarui informasi jurusan."
                  : "Masukkan nama dan kode jurusan baru."}
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className="jurusan-button inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-[#a7b4c7] dark:hover:bg-[#1b2a3d] dark:hover:text-slate-100"
            >
              <X className="h-4 w-4" />
              Batal
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px_180px_auto] md:items-end">

              <div>
                <label
                  htmlFor="nama-jurusan"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
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
                  autoFocus
                  className="jurusan-control w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:border-[#263449] dark:bg-[#111c2e] dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="kode-jurusan"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
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
                  className="jurusan-control w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm uppercase text-gray-900 outline-none placeholder:normal-case placeholder:text-gray-400 dark:border-[#263449] dark:bg-[#111c2e] dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="status-jurusan"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
                >
                  Status Jurusan
                </label>

                <select
                  id="status-jurusan"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as StatusJurusan)
                  }
                  className="jurusan-control w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none dark:border-[#263449] dark:bg-[#111c2e] dark:text-slate-100"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="jurusan-button inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-600/15 hover:bg-teal-700 hover:shadow-md hover:shadow-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                    : "Simpan"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Data Table */}
      <section className="jurusan-section jurusan-card overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-[#263449] dark:bg-[#111c2e]">

        <div className="border-b border-gray-100 px-5 py-4 dark:border-[#263449] sm:px-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
            Daftar Jurusan
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-[#a7b4c7]">
            Informasi jurusan yang tersimpan dalam sistem.
          </p>
        </div>

        {/* Filter */}
        <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-[#263449] dark:bg-[#0f1a2b] sm:px-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto] md:items-end">

            <div>
              <label
                htmlFor="cari-jurusan"
                className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-[#a7b4c7]"
              >
                Cari Jurusan
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="cari-jurusan"
                  type="text"
                  placeholder="Cari nama atau kode jurusan..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="jurusan-control w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:border-[#263449] dark:bg-[#111c2e] dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="filter-status"
                className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-[#a7b4c7]"
              >
                Status
              </label>

              <select
                id="filter-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "Semua" | StatusJurusan)
                }
                className="jurusan-control w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none dark:border-[#263449] dark:bg-[#111c2e] dark:text-slate-100"
              >
                <option value="Semua">Semua Status</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={resetFilter}
              disabled={!isFiltering}
              className="jurusan-button inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#263449] dark:bg-[#111c2e] dark:text-[#a7b4c7] dark:hover:bg-[#1b2a3d]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-sm">

            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]">
              <tr>
                <th className="w-16 px-5 py-3.5 sm:px-6">No.</th>
                <th className="px-5 py-3.5 sm:px-6">Nama Jurusan</th>
                <th className="px-5 py-3.5 sm:px-6">Kode</th>
                <th className="px-5 py-3.5 sm:px-6">Status</th>

                {canManage && (
                  <th className="px-5 py-3.5 text-right sm:px-6">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-[#263449]">
              {fetching ? (
                <tr>
                  <td
                    colSpan={canManage ? 5 : 4}
                    className="px-6 py-12 text-center text-sm text-gray-500 dark:text-[#a7b4c7]"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600/25 border-t-teal-600" />
                      Memuat data jurusan...
                    </div>
                  </td>
                </tr>
              ) : jurusan.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 5 : 4}
                    className="px-6 py-12 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-300">
                      <GraduationCap className="h-6 w-6" />
                    </div>

                    <p className="mt-3 font-medium text-gray-700 dark:text-[#a7b4c7]">
                      Belum ada data jurusan
                    </p>

                    <p className="mt-1 text-sm text-gray-500 dark:text-[#a7b4c7]">
                      {canManage
                        ? 'Klik tombol "Tambah Jurusan" untuk menambahkan data.'
                        : "Data jurusan belum tersedia."}
                    </p>
                  </td>
                </tr>
              ) : filteredJurusan.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 5 : 4}
                    className="px-6 py-12 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]">
                      <Search className="h-6 w-6" />
                    </div>

                    <p className="mt-3 font-medium text-gray-700 dark:text-[#a7b4c7]">
                      Jurusan tidak ditemukan
                    </p>

                    <p className="mt-1 text-sm text-gray-500 dark:text-[#a7b4c7]">
                      Coba ubah kata kunci atau filter status.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredJurusan.map((item, index) => {
                  const itemStatus = getItemStatus(item);

                  const badgeClass =
                    itemStatus === "Aktif"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : itemStatus === "Akan Datang"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-gray-100 text-gray-600 dark:bg-[#1b2a3d] dark:text-gray-300";

                  return (
                    <tr
                      key={item.id}
                      className="jurusan-row"
                      style={{
                        animationDelay: `${Math.min(index * 35, 350)}ms`,
                      }}
                    >
                      <td className="px-5 py-4 text-gray-500 dark:text-[#a7b4c7] sm:px-6 tabular-nums">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-slate-100 sm:px-6">
                        {item.nama}
                      </td>

                      <td className="px-5 py-4 sm:px-6">
                        <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-[#263449] dark:bg-[#1b2a3d] dark:text-[#a7b4c7] dark:hover:border-teal-800 dark:hover:bg-teal-900/20 dark:hover:text-teal-300">
                          {item.kode}
                        </span>
                      </td>

                      <td className="px-5 py-4 sm:px-6">
                        <span
                          className={`jurusan-badge inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
                        >
                          {itemStatus}
                        </span>
                      </td>

                      {canManage && (
                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              aria-label={`Edit ${item.nama}`}
                              className="jurusan-button inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteId(item.id);
                                setDeleteError("");
                              }}
                              aria-label={`Hapus ${item.nama}`}
                              className="jurusan-button inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!fetching && jurusan.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500 dark:border-[#263449] dark:text-[#a7b4c7] sm:px-6">
            Menampilkan {filteredJurusan.length} dari {jurusan.length} data
            jurusan
          </div>
        )}
      </section>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Hapus Jurusan?"
        description="Data jurusan yang dipilih akan dihapus. Tindakan ini tidak dapat dibatalkan."
        loading={deleteLoading}
        error={deleteError}
        onCancel={() => {
          if (!deleteLoading) setDeleteId(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

export default Jurusan;