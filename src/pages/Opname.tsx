import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ClipboardCheck, Eye, Plus, RotateCcw, Search, X } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { getStoredRole } from "../utils/permissions";

type ResultType = "Sesuai" | "Kurang" | "Lebih";
type ResultFilter = "Semua" | ResultType;

interface OpnameData {
  id: string;
  itemId: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  notes: string | null;
  opnameDate: string;
  createdAt?: string;
  Item?: {
    id: string;
    name: string;
  };
  User?: {
    id: string;
    name: string;
  };
}

interface BarangOption {
  id: string;
  name: string;
  stock?: number;
}

const RESULT_OPTIONS: ResultType[] = ["Sesuai", "Kurang", "Lebih"];

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2.5 text-gray-900 dark:text-slate-100 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function resultOf(difference: number): ResultType {
  if (difference === 0) return "Sesuai";
  return difference < 0 ? "Kurang" : "Lebih";
}

function resultClass(result: ResultType) {
  if (result === "Sesuai") {
    return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300";
  }
  if (result === "Kurang") {
    return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  }
  return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
}

function formatDifference(difference: number) {
  return difference > 0 ? `+${difference}` : String(difference);
}

function todayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function Opname() {
  const { formatDate } = useLanguage();
  const canManage = getStoredRole() === "admin";

  const [opname, setOpname] = useState<OpnameData[]>([]);
  const [barang, setBarang] = useState<BarangOption[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("Semua");

  const [modalOpen, setModalOpen] = useState(false);
  const [itemId, setItemId] = useState("");
  const [physicalStock, setPhysicalStock] = useState("");
  const [opnameDate, setOpnameDate] = useState(todayValue());
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<OpnameData | null>(null);

  async function getOpname() {
    try {
      const response = await api.get<OpnameData[]>("/stock-opname");
      setOpname(response.data);
      setListError("");
    } catch (error) {
      console.error("Gagal mengambil data opname", error);
      setListError("Data opname gagal dimuat.");
    } finally {
      setListLoading(false);
    }
  }

  async function getBarang() {
    try {
      const response = await api.get<BarangOption[]>("/items");
      setBarang(response.data);
    } catch (error) {
      console.error("Gagal mengambil data barang", error);
    }
  }

  useEffect(() => {
    void getOpname();
    void getBarang();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const counts = useMemo(
    () => ({
      total: opname.length,
      sesuai: opname.filter((item) => item.difference === 0).length,
      kurang: opname.filter((item) => item.difference < 0).length,
      lebih: opname.filter((item) => item.difference > 0).length,
    }),
    [opname],
  );

  const filteredOpname = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return opname.filter((item) => {
      const matchResult =
        resultFilter === "Semua" || resultOf(item.difference) === resultFilter;
      const matchName =
        !keyword || (item.Item?.name || "").toLowerCase().includes(keyword);
      return matchResult && matchName;
    });
  }, [opname, search, resultFilter]);

  const filterActive = search.trim() !== "" || resultFilter !== "Semua";

  function resetFilters() {
    setSearch("");
    setResultFilter("Semua");
  }

  const selectedItem = barang.find((item) => item.id === itemId);
  const systemStock = selectedItem?.stock ?? 0;
  const physicalNumber = physicalStock === "" ? null : Number(physicalStock);
  const physicalValid =
    physicalNumber !== null &&
    Number.isInteger(physicalNumber) &&
    physicalNumber >= 0;
  const difference =
    selectedItem && physicalValid ? (physicalNumber as number) - systemStock : null;

  function resetForm() {
    setItemId("");
    setPhysicalStock("");
    setOpnameDate(todayValue());
    setNotes("");
    setFormError("");
  }

  function openCreate() {
    resetForm();
    void getBarang();
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    resetForm();
  }

  useEffect(() => {
    if (!modalOpen && !detail) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || saving) return;
      if (modalOpen) {
        setModalOpen(false);
        resetForm();
      } else {
        setDetail(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, detail, saving]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    if (!itemId) {
      setFormError("Pilih barang terlebih dahulu.");
      return;
    }

    if (!physicalValid) {
      setFormError("Stok fisik harus berupa angka bulat 0 atau lebih.");
      return;
    }

    if (!opnameDate) {
      setFormError("Tanggal opname wajib diisi.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await api.post("/stock-opname", {
        itemId,
        physicalStock: physicalNumber,
        opnameDate,
        notes: notes.trim(),
      });

      setModalOpen(false);
      resetForm();
      setNotice("Opname berhasil disimpan. Stok barang telah diperbarui.");
      await Promise.all([getOpname(), getBarang()]);
    } catch (error: any) {
      console.error(error);
      setFormError(error.response?.data?.message || "Gagal menyimpan opname");
    } finally {
      setSaving(false);
    }
  }

  const summaryTiles: { label: string; value: number; filter: ResultFilter }[] =
    [
      { label: "Semua Opname", value: counts.total, filter: "Semua" },
      { label: "Sesuai", value: counts.sesuai, filter: "Sesuai" },
      { label: "Kurang", value: counts.kurang, filter: "Kurang" },
      { label: "Lebih", value: counts.lebih, filter: "Lebih" },
    ];

  return (
    <div>
      <PageHeader
        title="Opname"
        description="Catat hasil pemeriksaan stok fisik barang"
        icon={ClipboardCheck}
      />

      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/70 dark:bg-green-950/40 dark:text-green-300"
        >
          {notice}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryTiles.map((tile) => (
          <button
            key={tile.label}
            type="button"
            onClick={() => setResultFilter(tile.filter)}
            aria-pressed={resultFilter === tile.filter}
            className={`cursor-pointer rounded-xl bg-white dark:bg-[#111c2e] p-4 text-left shadow-sm ${
              resultFilter === tile.filter ? "ring-2 ring-[#168b87]" : ""
            }`}
          >
            <p className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7]">
              {tile.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-100">
              {tile.value}
            </p>
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-xl bg-white dark:bg-[#111c2e] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama barang..."
              aria-label="Cari nama barang"
              className={`${inputClass} pl-10`}
            />
          </div>

          <label className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7] lg:w-48">
            Hasil
            <select
              value={resultFilter}
              onChange={(event) =>
                setResultFilter(event.target.value as ResultFilter)
              }
              className={`${inputClass} mt-1 font-normal`}
            >
              <option value="Semua">Semua hasil</option>
              {RESULT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!filterActive}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-[#1b2a3d] px-4 py-2.5 font-semibold text-gray-700 dark:text-[#a7b4c7] hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Opname
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white dark:bg-[#111c2e] shadow-sm">
        <div className="flex flex-col gap-1 border-b border-gray-200 dark:border-[#263449] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Riwayat Opname
          </h2>
          <p className="text-sm text-gray-500 dark:text-[#a7b4c7]">
            Menampilkan {filteredOpname.length} dari {opname.length} opname
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-[#1b2a3d] text-xs uppercase text-gray-500 dark:text-[#a7b4c7]">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Stok Sistem</th>
                <th className="px-6 py-4">Stok Fisik</th>
                <th className="px-6 py-4">Selisih</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
              {filteredOpname.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 dark:hover:bg-[#1b2a3d]"
                >
                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-slate-100">
                      {item.Item?.name || "-"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                      {formatDate(item.opnameDate)}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                    {item.systemStock}
                  </td>

                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                    {item.physicalStock}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${resultClass(resultOf(item.difference))}`}
                    >
                      {formatDifference(item.difference)}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setDetail(item)}
                      aria-label={`Lihat detail opname ${item.Item?.name || ""}`}
                      title="Lihat detail opname"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/60"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOpname.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 dark:text-[#a7b4c7]"
                  >
                    {listLoading ? (
                      "Memuat data opname..."
                    ) : listError ? (
                      <div>
                        <p className="mb-3">{listError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setListLoading(true);
                            void getOpname();
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                        >
                          Coba lagi
                        </button>
                      </div>
                    ) : opname.length === 0 ? (
                      <div>
                        <p className="mb-3">Belum ada data opname.</p>
                        {canManage && (
                          <button
                            type="button"
                            onClick={openCreate}
                            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                          >
                            Tambah opname pertama
                          </button>
                        )}
                      </div>
                    ) : (
                      "Tidak ada opname yang cocok dengan filter."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canManage && modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="opname-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white dark:bg-[#111c2e] shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-[#263449] px-6 py-4">
              <div>
                <h2
                  id="opname-modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-slate-100"
                >
                  Tambah Opname
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-[#a7b4c7]">
                  Catat hasil pemeriksaan stok fisik barang.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Tutup"
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:text-[#a7b4c7] dark:hover:bg-[#1b2a3d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="px-6 py-5">
              <div className="mb-4">
                <label
                  htmlFor="opname-item"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
                >
                  Barang
                </label>
                <select
                  id="opname-item"
                  value={itemId}
                  onChange={(event) => setItemId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Pilih barang</option>
                  {barang.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="opname-system"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
                  >
                    Stok Sistem
                  </label>
                  <input
                    id="opname-system"
                    type="number"
                    readOnly
                    value={selectedItem ? systemStock : ""}
                    placeholder="Pilih barang"
                    className="w-full rounded-lg border border-gray-300 dark:border-[#263449] bg-gray-50 dark:bg-[#1b2a3d] px-3 py-2.5 text-gray-600 dark:text-[#a7b4c7] outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="opname-physical"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
                  >
                    Stok Fisik
                  </label>
                  <input
                    id="opname-physical"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={physicalStock}
                    onChange={(event) => setPhysicalStock(event.target.value)}
                    placeholder="Hasil hitung fisik"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#263449] px-4 py-3">
                <span className="text-sm font-medium text-gray-700 dark:text-[#a7b4c7]">
                  Selisih
                </span>
                {difference === null ? (
                  <span className="text-sm text-gray-400 dark:text-[#64748b]">
                    -
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${resultClass(resultOf(difference))}`}
                  >
                    {formatDifference(difference)} ({resultOf(difference)})
                  </span>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="opname-date"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
                >
                  Tanggal Opname
                </label>
                <input
                  id="opname-date"
                  type="date"
                  value={opnameDate}
                  onChange={(event) => setOpnameDate(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="opname-notes"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
                >
                  Catatan (opsional)
                </label>
                <textarea
                  id="opname-notes"
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Contoh: barang rusak, salah catat, dll."
                  className={inputClass}
                />
              </div>

              {difference !== null && (
                <p className="mb-4 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800 dark:bg-teal-950/30 dark:text-teal-200">
                  Setelah disimpan, stok barang akan diperbarui menjadi{" "}
                  {physicalNumber}.
                </p>
              )}

              {formError && (
                <p
                  role="alert"
                  className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300"
                >
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg bg-gray-100 dark:bg-[#1b2a3d] px-5 py-2.5 font-semibold text-gray-700 dark:text-[#a7b4c7] hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan Opname"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetail(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="opname-detail-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white dark:bg-[#111c2e] shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-[#263449] px-6 py-4">
              <div>
                <h2
                  id="opname-detail-title"
                  className="text-lg font-semibold text-gray-900 dark:text-slate-100"
                >
                  Detail Opname
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-[#a7b4c7]">
                  {detail.Item?.name || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Tutup"
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:text-[#a7b4c7] dark:hover:bg-[#1b2a3d]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-gray-200 dark:border-[#263449] px-3 py-3">
                  <p className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                    Stok Sistem
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-slate-100">
                    {detail.systemStock}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-[#263449] px-3 py-3">
                  <p className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                    Stok Fisik
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-slate-100">
                    {detail.physicalStock}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-[#263449] px-3 py-3">
                  <p className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                    Selisih
                  </p>
                  <p className="mt-1">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${resultClass(resultOf(detail.difference))}`}
                    >
                      {formatDifference(detail.difference)}
                    </span>
                  </p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-[#a7b4c7]">
                    Tanggal Opname
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-slate-100">
                    {formatDate(detail.opnameDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-[#a7b4c7]">
                    Hasil
                  </dt>
                  <dd>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${resultClass(resultOf(detail.difference))}`}
                    >
                      {resultOf(detail.difference)}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-[#a7b4c7]">
                    Dicatat oleh
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-slate-100">
                    {detail.User?.name || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-gray-500 dark:text-[#a7b4c7]">
                    Catatan
                  </dt>
                  <dd className="rounded-lg bg-gray-50 px-3 py-2 text-gray-900 dark:bg-[#1b2a3d] dark:text-slate-100">
                    {detail.notes || "-"}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="rounded-lg bg-gray-100 dark:bg-[#1b2a3d] px-5 py-2.5 font-semibold text-gray-700 dark:text-[#a7b4c7] hover:bg-gray-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Opname;