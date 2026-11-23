
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { Eye, PackageMinus, Plus, RotateCcw, Search, X } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { getStoredRole } from "../utils/permissions";

type Reason = "Penjualan" | "Penggunaan" | "Peminjaman" | "Lainnya";
type ReasonFilter = "Semua" | Reason;

interface BarangKeluarData {
  id: string;
  transactionNumber: string;
  issueDate: string;
  recipientName: string;
  officerName: string;
  itemId: string;
  quantity: number;
  stockBefore: number;
  reason: Reason;
  notes: string | null;
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

const REASON_OPTIONS: Reason[] = [
  "Penjualan",
  "Penggunaan",
  "Peminjaman",
  "Lainnya",
];

const MAX_INT = 2147483647;

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2.5 text-gray-900 dark:text-slate-100 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const readOnlyClass =
  "w-full rounded-lg border border-gray-300 dark:border-[#263449] bg-gray-50 dark:bg-[#1b2a3d] px-3 py-2.5 text-gray-600 dark:text-[#a7b4c7] outline-none";

const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]";

function reasonClass(reason: Reason) {
  if (reason === "Penjualan") {
    return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300";
  }
  if (reason === "Penggunaan") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  }
  if (reason === "Peminjaman") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
  return "bg-gray-100 dark:bg-[#1b2a3d] text-gray-600 dark:text-gray-300";
}

function todayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function dateOnly(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function storedUserName() {
  try {
    const storedUser = localStorage.getItem("user");
    const name = storedUser
      ? (JSON.parse(storedUser) as { name?: unknown }).name
      : "";
    return typeof name === "string" ? name : "";
  } catch {
    return "";
  }
}

function parseQuantity(value: string): number | null {
  if (value.trim() === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > MAX_INT) return null;
  return number;
}

function BarangKeluar() {
  const { formatDate } = useLanguage();
  const canManage = getStoredRole() !== "";

  const [issues, setIssues] = useState<BarangKeluarData[]>([]);
  const [barang, setBarang] = useState<BarangOption[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("Semua");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [issueDate, setIssueDate] = useState(todayValue());
  const [recipientName, setRecipientName] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<Reason | "">("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<BarangKeluarData | null>(null);

  async function getIssues() {
    try {
      const response = await api.get<BarangKeluarData[]>("/goods-issues");
      setIssues(response.data);
      setListError("");
    } catch (error) {
      console.error("Gagal mengambil data barang keluar", error);
      setListError("Data barang keluar gagal dimuat.");
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
    void getIssues();
    void getBarang();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Pratinjau nomor transaksi (nomor final tetap dibuat server saat disimpan)
  useEffect(() => {
    if (!modalOpen || !issueDate) {
      setTransactionNumber("");
      return;
    }

    let cancelled = false;
    api
      .get<{ transactionNumber: string }>("/goods-issues/next-number", {
        params: { date: issueDate },
      })
      .then((response) => {
        if (!cancelled) setTransactionNumber(response.data.transactionNumber);
      })
      .catch(() => {
        if (!cancelled) setTransactionNumber("");
      });

    return () => {
      cancelled = true;
    };
  }, [modalOpen, issueDate]);

  const recipientSuggestions = useMemo(
    () => [...new Set(issues.map((item) => item.recipientName))],
    [issues],
  );

  const officerSuggestions = useMemo(
    () => [...new Set(issues.map((item) => item.officerName))],
    [issues],
  );

  const counts = useMemo(
    () => ({
      total: issues.length,
      Penjualan: issues.filter((item) => item.reason === "Penjualan").length,
      Penggunaan: issues.filter((item) => item.reason === "Penggunaan").length,
      Peminjaman: issues.filter((item) => item.reason === "Peminjaman").length,
      Lainnya: issues.filter((item) => item.reason === "Lainnya").length,
    }),
    [issues],
  );

  const filteredIssues = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return issues.filter((item) => {
      const date = dateOnly(item.issueDate);
      const haystack =
        `${item.transactionNumber} ${item.recipientName} ${item.officerName} ${item.Item?.name || ""}`.toLowerCase();

      return (
        (!keyword || haystack.includes(keyword)) &&
        (reasonFilter === "Semua" || item.reason === reasonFilter) &&
        (!dari || date >= dari) &&
        (!sampai || date <= sampai)
      );
    });
  }, [issues, search, reasonFilter, dari, sampai]);

  const filterActive =
    search.trim() !== "" ||
    reasonFilter !== "Semua" ||
    dari !== "" ||
    sampai !== "";

  function resetFilters() {
    setSearch("");
    setReasonFilter("Semua");
    setDari("");
    setSampai("");
  }

  const selectedItem = barang.find((item) => item.id === itemId);
  const currentStock = selectedItem?.stock ?? 0;
  const quantityNumber = parseQuantity(quantity);
  const exceedsStock =
    selectedItem !== undefined &&
    quantityNumber !== null &&
    quantityNumber > currentStock;
  const remainingStock =
    selectedItem && quantityNumber !== null && !exceedsStock
      ? currentStock - quantityNumber
      : null;

  function resetForm() {
    setIssueDate(todayValue());
    setRecipientName("");
    setOfficerName(storedUserName());
    setItemId("");
    setQuantity("");
    setReason("");
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

    if (!issueDate) {
      setFormError("Tanggal barang keluar wajib diisi.");
      return;
    }
    if (!recipientName.trim()) {
      setFormError("Nama penerima wajib diisi.");
      return;
    }
    if (!officerName.trim()) {
      setFormError("Nama petugas wajib diisi.");
      return;
    }
    if (!itemId) {
      setFormError("Pilih barang terlebih dahulu.");
      return;
    }
    if (quantityNumber === null) {
      setFormError("Jumlah barang keluar harus berupa angka bulat 1 atau lebih.");
      return;
    }
    if (exceedsStock) {
      setFormError(
        `Jumlah melebihi stok yang tersedia (${currentStock}).`,
      );
      return;
    }
    if (!reason) {
      setFormError("Pilih alasan barang keluar.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await api.post("/goods-issues", {
        issueDate,
        recipientName: recipientName.trim(),
        officerName: officerName.trim(),
        itemId,
        quantity: quantityNumber,
        reason,
        notes: notes.trim(),
      });

      setModalOpen(false);
      resetForm();
      setNotice(
        `Barang keluar berhasil disimpan. Stok ${selectedItem?.name || "barang"} berkurang ${quantityNumber}.`,
      );
      await Promise.all([getIssues(), getBarang()]);
    } catch (error: any) {
      console.error(error);
      setFormError(
        error.response?.data?.message || "Gagal menyimpan barang keluar",
      );
      // Stok mungkin sudah berubah, muat ulang agar tampilan akurat
      void getBarang();
    } finally {
      setSaving(false);
    }
  }

  const summaryTiles: { label: string; value: number; filter: ReasonFilter }[] =
    [
      { label: "Semua Transaksi", value: counts.total, filter: "Semua" },
      { label: "Penjualan", value: counts.Penjualan, filter: "Penjualan" },
      { label: "Penggunaan", value: counts.Penggunaan, filter: "Penggunaan" },
      { label: "Peminjaman", value: counts.Peminjaman, filter: "Peminjaman" },
      { label: "Lainnya", value: counts.Lainnya, filter: "Lainnya" },
    ];

  return (
    <div className="barang-keluar-page">
      <style>{`
        @keyframes barangKeluarFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes barangKeluarFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes barangKeluarModalIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .barang-keluar-page {
          animation: barangKeluarFadeUp 0.45s ease-out both;
        }

        .barang-keluar-section {
          animation: barangKeluarFadeUp 0.5s ease-out both;
        }

        .barang-keluar-summary {
          animation-delay: 50ms;
        }

        .barang-keluar-filter {
          animation-delay: 100ms;
        }

        .barang-keluar-table {
          animation-delay: 150ms;
        }

        .barang-keluar-row {
          animation: barangKeluarFadeIn 0.35s ease-out both;
          transition: background-color 180ms ease;
        }

        .barang-keluar-modal-backdrop {
          animation: barangKeluarFadeIn 0.18s ease-out both;
        }

        .barang-keluar-modal-panel {
          animation: barangKeluarModalIn 0.22s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .barang-keluar-page,
          .barang-keluar-section,
          .barang-keluar-row,
          .barang-keluar-modal-backdrop,
          .barang-keluar-modal-panel {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <PageHeader
        title="Barang Keluar"
        description="Catat pengeluaran barang dari stok koperasi"
        icon={PackageMinus}
      />

      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/70 dark:bg-green-950/40 dark:text-green-300"
        >
          {notice}
        </div>
      )}

      <div className="barang-keluar-section barang-keluar-summary mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {summaryTiles.map((tile) => (
          <button
            key={tile.label}
            type="button"
            onClick={() => setReasonFilter(tile.filter)}
            aria-pressed={reasonFilter === tile.filter}
            className={`cursor-pointer rounded-xl bg-white dark:bg-[#111c2e] p-4 text-left shadow-sm transition-colors duration-200 hover:bg-teal-50 dark:hover:bg-teal-950/20 ${
              reasonFilter === tile.filter ? "ring-2 ring-[#168b87]" : ""
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

      <div className="barang-keluar-section barang-keluar-filter mb-6 rounded-xl bg-white dark:bg-[#111c2e] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari no. transaksi, penerima, atau barang..."
              aria-label="Cari barang keluar"
              className={`${inputClass} pl-10`}
            />
          </div>

          <label className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7] lg:w-40">
            Alasan
            <select
              value={reasonFilter}
              onChange={(event) =>
                setReasonFilter(event.target.value as ReasonFilter)
              }
              className={`${inputClass} mt-1 font-normal`}
            >
              <option value="Semua">Semua alasan</option>
              {REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7] lg:w-40">
            Dari tanggal
            <input
              type="date"
              value={dari}
              onChange={(event) => setDari(event.target.value)}
              className={`${inputClass} mt-1 font-normal`}
            />
          </label>

          <label className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7] lg:w-40">
            Sampai tanggal
            <input
              type="date"
              value={sampai}
              onChange={(event) => setSampai(event.target.value)}
              className={`${inputClass} mt-1 font-normal`}
            />
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
              Tambah Barang Keluar
            </button>
          )}
        </div>
      </div>

      <div className="barang-keluar-section barang-keluar-table overflow-hidden rounded-xl bg-white dark:bg-[#111c2e] shadow-sm">
        <div className="flex flex-col gap-1 border-b border-gray-200 dark:border-[#263449] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Riwayat Barang Keluar
          </h2>
          <p className="text-sm text-gray-500 dark:text-[#a7b4c7]">
            Menampilkan {filteredIssues.length} dari {issues.length} transaksi
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-[#1b2a3d] text-xs uppercase text-gray-500 dark:text-[#a7b4c7]">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">No. Transaksi</th>
                <th className="px-6 py-4">Penerima</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Jumlah</th>
                <th className="px-6 py-4">Alasan</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
              {filteredIssues.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    animationDelay: `${Math.min(index * 35, 350)}ms`,
                  }}
                  className="barang-keluar-row hover:bg-teal-50 dark:hover:bg-teal-950/20"
                >
                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-slate-100">
                      {item.transactionNumber}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                      {formatDate(item.issueDate)}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                    {item.recipientName}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">
                    {item.Item?.name || "-"}
                  </td>

                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                    {item.quantity}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${reasonClass(item.reason)}`}
                    >
                      {item.reason}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setDetail(item)}
                      aria-label={`Lihat detail ${item.transactionNumber}`}
                      title="Lihat detail transaksi"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/60"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredIssues.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500 dark:text-[#a7b4c7]"
                  >
                    {listLoading ? (
                      "Memuat data barang keluar..."
                    ) : listError ? (
                      <div>
                        <p className="mb-3">{listError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setListLoading(true);
                            void getIssues();
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                        >
                          Coba lagi
                        </button>
                      </div>
                    ) : issues.length === 0 ? (
                      <div>
                        <p className="mb-3">Belum ada data barang keluar.</p>
                        {canManage && (
                          <button
                            type="button"
                            onClick={openCreate}
                            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                          >
                            Tambah barang keluar pertama
                          </button>
                        )}
                      </div>
                    ) : (
                      "Tidak ada transaksi yang cocok dengan filter."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canManage &&
        modalOpen &&
        createPortal(
          <div
            className="barang-keluar-modal-backdrop fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="issue-modal-title"
              className="barang-keluar-modal-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-[#263449] dark:bg-[#111c2e]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-[#263449] px-6 py-4">
                <div>
                  <h2
                    id="issue-modal-title"
                    className="text-lg font-semibold text-gray-900 dark:text-slate-100"
                  >
                    Tambah Barang Keluar
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-[#a7b4c7]">
                    Stok barang otomatis berkurang setelah transaksi disimpan.
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
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="issue-number" className={labelClass}>
                      No. Transaksi
                    </label>
                    <input
                      id="issue-number"
                      type="text"
                      readOnly
                      value={transactionNumber}
                      placeholder="Dibuat otomatis saat disimpan"
                      className={readOnlyClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="issue-date" className={labelClass}>
                      Tanggal Barang Keluar
                    </label>
                    <input
                      id="issue-date"
                      type="date"
                      value={issueDate}
                      onChange={(event) => setIssueDate(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="issue-recipient" className={labelClass}>
                      Nama Penerima
                    </label>
                    <input
                      id="issue-recipient"
                      type="text"
                      list="issue-recipient-list"
                      maxLength={150}
                      autoFocus
                      value={recipientName}
                      onChange={(event) => setRecipientName(event.target.value)}
                      placeholder="Contoh: Siti"
                      className={inputClass}
                    />
                    <datalist id="issue-recipient-list">
                      {recipientSuggestions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label htmlFor="issue-officer" className={labelClass}>
                      Nama Petugas
                    </label>
                    <input
                      id="issue-officer"
                      type="text"
                      list="issue-officer-list"
                      maxLength={150}
                      value={officerName}
                      onChange={(event) => setOfficerName(event.target.value)}
                      placeholder="Petugas yang mengeluarkan barang"
                      className={inputClass}
                    />
                    <datalist id="issue-officer-list">
                      {officerSuggestions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="issue-item" className={labelClass}>
                    Nama Barang
                  </label>
                  <select
                    id="issue-item"
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

                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="issue-stock" className={labelClass}>
                      Stok Saat Ini
                    </label>
                    <input
                      id="issue-stock"
                      type="number"
                      readOnly
                      value={selectedItem ? currentStock : ""}
                      placeholder="Pilih barang"
                      className={readOnlyClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="issue-quantity" className={labelClass}>
                      Jumlah Keluar
                    </label>
                    <input
                      id="issue-quantity"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max={selectedItem ? currentStock : undefined}
                      step="1"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      placeholder="Contoh: 5"
                      className={`${inputClass} ${
                        exceedsStock
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label htmlFor="issue-reason" className={labelClass}>
                      Alasan
                    </label>
                    <select
                      id="issue-reason"
                      value={reason}
                      onChange={(event) =>
                        setReason(event.target.value as Reason)
                      }
                      className={inputClass}
                    >
                      <option value="">Pilih alasan</option>
                      {REASON_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="issue-notes" className={labelClass}>
                    Catatan (opsional)
                  </label>
                  <textarea
                    id="issue-notes"
                    rows={3}
                    maxLength={500}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Contoh: dipinjam untuk acara sekolah, dll."
                    className={inputClass}
                  />
                </div>

                {exceedsStock && (
                  <p
                    role="alert"
                    className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300"
                  >
                    Jumlah melebihi stok yang tersedia ({currentStock}).
                  </p>
                )}

                {remainingStock !== null && (
                  <p className="mb-4 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800 dark:bg-teal-950/30 dark:text-teal-200">
                    Stok {selectedItem?.name} akan berkurang dari {currentStock}{" "}
                    menjadi {remainingStock}.
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
                    disabled={saving || exceedsStock}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Menyimpan..." : "Simpan Barang Keluar"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {detail &&
        createPortal(
          <div
            className="barang-keluar-modal-backdrop fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDetail(null);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="issue-detail-title"
              className="barang-keluar-modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-[#263449] dark:bg-[#111c2e]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-[#263449] px-6 py-4">
                <div>
                  <h2
                    id="issue-detail-title"
                    className="text-lg font-semibold text-gray-900 dark:text-slate-100"
                  >
                    Detail Barang Keluar
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-[#a7b4c7]">
                    {detail.transactionNumber}
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
                      Stok Sebelum
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-slate-100">
                      {detail.stockBefore}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-[#263449] px-3 py-3">
                    <p className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                      Jumlah Keluar
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-slate-100">
                      -{detail.quantity}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-[#263449] px-3 py-3">
                    <p className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                      Stok Sesudah
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-slate-100">
                      {detail.stockBefore - detail.quantity}
                    </p>
                  </div>
                </div>

                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500 dark:text-[#a7b4c7]">
                      Tanggal Barang Keluar
                    </dt>
                    <dd className="font-medium text-gray-900 dark:text-slate-100">
                      {formatDate(detail.issueDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500 dark:text-[#a7b4c7]">
                      Nama Barang
                    </dt>
                    <dd className="font-medium text-gray-900 dark:text-slate-100">
                      {detail.Item?.name || "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500 dark:text-[#a7b4c7]">
                      Alasan
                    </dt>
                    <dd>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${reasonClass(detail.reason)}`}
                      >
                        {detail.reason}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500 dark:text-[#a7b4c7]">
                      Penerima
                    </dt>
                    <dd className="font-medium text-gray-900 dark:text-slate-100">
                      {detail.recipientName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500 dark:text-[#a7b4c7]">
                      Petugas
                    </dt>
                    <dd className="font-medium text-gray-900 dark:text-slate-100">
                      {detail.officerName}
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
          </div>,
          document.body,
        )}
    </div>
  );
}

export default BarangKeluar;
