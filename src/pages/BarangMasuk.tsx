
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Eye, PackagePlus, Plus, RotateCcw, Search, X } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { getStoredRole } from "../utils/permissions";

interface BarangMasukData {
  id: string;
  transactionNumber: string;
  receiptDate: string;
  supplierName: string;
  senderName: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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

const MAX_INT = 2147483647;

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2.5 text-gray-900 dark:text-slate-100 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const readOnlyClass =
  "w-full rounded-lg border border-gray-300 dark:border-[#263449] bg-gray-50 dark:bg-[#1b2a3d] px-3 py-2.5 text-gray-600 dark:text-[#a7b4c7] outline-none";

const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-[#a7b4c7]";

function todayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function dateOnly(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function parseWhole(value: string, min: number): number | null {
  if (value.trim() === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > MAX_INT) {
    return null;
  }
  return number;
}

function BarangMasuk() {
  const { formatCurrency, formatDate } = useLanguage();
  const canManage = getStoredRole() !== "";

  const [receipts, setReceipts] = useState<BarangMasukData[]>([]);
  const [barang, setBarang] = useState<BarangOption[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [receiptDate, setReceiptDate] = useState(todayValue());
  const [supplierName, setSupplierName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<BarangMasukData | null>(null);

  async function getReceipts() {
    try {
      const response = await api.get<BarangMasukData[]>("/goods-receipts");
      setReceipts(response.data);
      setListError("");
    } catch (error) {
      console.error("Gagal mengambil data barang masuk", error);
      setListError("Data barang masuk gagal dimuat.");
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
    void getReceipts();
    void getBarang();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Pratinjau nomor transaksi (nomor final tetap dibuat server saat disimpan)
  useEffect(() => {
    if (!modalOpen || !receiptDate) {
      setTransactionNumber("");
      return;
    }

    let cancelled = false;
    api
      .get<{ transactionNumber: string }>("/goods-receipts/next-number", {
        params: { date: receiptDate },
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
  }, [modalOpen, receiptDate]);

  const supplierSuggestions = useMemo(
    () => [...new Set(receipts.map((item) => item.supplierName))],
    [receipts],
  );

  const senderSuggestions = useMemo(
    () => [...new Set(receipts.map((item) => item.senderName))],
    [receipts],
  );

  const filteredReceipts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return receipts.filter((item) => {
      const date = dateOnly(item.receiptDate);
      const haystack =
        `${item.transactionNumber} ${item.supplierName} ${item.senderName} ${item.Item?.name || ""}`.toLowerCase();

      return (
        (!keyword || haystack.includes(keyword)) &&
        (!dari || date >= dari) &&
        (!sampai || date <= sampai)
      );
    });
  }, [receipts, search, dari, sampai]);

  const totals = useMemo(
    () => ({
      transactions: filteredReceipts.length,
      quantity: filteredReceipts.reduce((sum, item) => sum + item.quantity, 0),
      price: filteredReceipts.reduce((sum, item) => sum + item.totalPrice, 0),
    }),
    [filteredReceipts],
  );

  const filterActive = search.trim() !== "" || dari !== "" || sampai !== "";

  function resetFilters() {
    setSearch("");
    setDari("");
    setSampai("");
  }

  const selectedItem = barang.find((item) => item.id === itemId);
  const quantityNumber = parseWhole(quantity, 1);
  const unitPriceNumber = parseWhole(unitPrice, 0);
  const totalPrice =
    quantityNumber !== null && unitPriceNumber !== null
      ? quantityNumber * unitPriceNumber
      : null;
  const nextStock =
    selectedItem && quantityNumber !== null
      ? (selectedItem.stock ?? 0) + quantityNumber
      : null;

  function resetForm() {
    setReceiptDate(todayValue());
    setSupplierName("");
    setSenderName("");
    setItemId("");
    setQuantity("");
    setUnitPrice("");
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

    if (!receiptDate) {
      setFormError("Tanggal barang masuk wajib diisi.");
      return;
    }
    if (!supplierName.trim()) {
      setFormError("Nama supplier wajib diisi.");
      return;
    }
    if (!senderName.trim()) {
      setFormError("Nama pengirim wajib diisi.");
      return;
    }
    if (!itemId) {
      setFormError("Pilih barang terlebih dahulu.");
      return;
    }
    if (quantityNumber === null) {
      setFormError("Jumlah barang masuk harus berupa angka bulat 1 atau lebih.");
      return;
    }
    if (unitPriceNumber === null) {
      setFormError("Harga beli harus berupa angka bulat 0 atau lebih.");
      return;
    }
    if (totalPrice !== null && totalPrice > MAX_INT) {
      setFormError("Total harga terlalu besar. Periksa jumlah dan harga beli.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await api.post("/goods-receipts", {
        receiptDate,
        supplierName: supplierName.trim(),
        senderName: senderName.trim(),
        itemId,
        quantity: quantityNumber,
        unitPrice: unitPriceNumber,
        notes: notes.trim(),
      });

      setModalOpen(false);
      resetForm();
      setNotice(
        `Barang masuk berhasil disimpan. Stok ${selectedItem?.name || "barang"} bertambah ${quantityNumber}.`,
      );
      await Promise.all([getReceipts(), getBarang()]);
    } catch (error: any) {
      console.error(error);
      setFormError(
        error.response?.data?.message || "Gagal menyimpan barang masuk",
      );
    } finally {
      setSaving(false);
    }
  }

  const summaryTiles: { label: string; value: string }[] = [
    { label: "Total Transaksi", value: String(totals.transactions) },
    { label: "Total Barang Masuk", value: String(totals.quantity) },
    { label: "Total Pembelian", value: formatCurrency(totals.price) },
  ];

  return (
    <div className="barang-masuk-page">
      <style>{`
        @keyframes barangMasukFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes barangMasukFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .barang-masuk-page {
          animation: barangMasukFadeUp 0.45s ease-out both;
        }

        .barang-masuk-section {
          animation: barangMasukFadeUp 0.5s ease-out both;
        }

        .barang-masuk-summary {
          animation-delay: 50ms;
        }

        .barang-masuk-filter {
          animation-delay: 100ms;
        }

        .barang-masuk-table {
          animation-delay: 150ms;
        }

        .barang-masuk-row {
          animation: barangMasukFadeIn 0.35s ease-out both;
          transition: background-color 180ms ease;
        }

        @media (prefers-reduced-motion: reduce) {
          .barang-masuk-page,
          .barang-masuk-section,
          .barang-masuk-row {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <PageHeader
        title="Barang Masuk"
        description="Catat penerimaan barang dari supplier"
        icon={PackagePlus}
      />

      {notice && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/70 dark:bg-green-950/40 dark:text-green-300"
        >
          {notice}
        </div>
      )}

      <div className="barang-masuk-section barang-masuk-summary mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryTiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl bg-white dark:bg-[#111c2e] p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7]">
              {tile.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-100">
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      <div className="barang-masuk-section barang-masuk-filter mb-6 rounded-xl bg-white dark:bg-[#111c2e] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari no. transaksi, supplier, atau barang..."
              aria-label="Cari barang masuk"
              className={`${inputClass} pl-10`}
            />
          </div>

          <label className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7] lg:w-44">
            Dari tanggal
            <input
              type="date"
              value={dari}
              onChange={(event) => setDari(event.target.value)}
              className={`${inputClass} mt-1 font-normal`}
            />
          </label>

          <label className="text-xs font-medium text-gray-500 dark:text-[#a7b4c7] lg:w-44">
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
              Tambah Barang Masuk
            </button>
          )}
        </div>
      </div>

      <div className="barang-masuk-section barang-masuk-table overflow-hidden rounded-xl bg-white dark:bg-[#111c2e] shadow-sm">
        <div className="flex flex-col gap-1 border-b border-gray-200 dark:border-[#263449] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Riwayat Barang Masuk
          </h2>
          <p className="text-sm text-gray-500 dark:text-[#a7b4c7]">
            Menampilkan {filteredReceipts.length} dari {receipts.length}{" "}
            transaksi
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-[#1b2a3d] text-xs uppercase text-gray-500 dark:text-[#a7b4c7]">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">No. Transaksi</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Jumlah</th>
                <th className="px-6 py-4">Total Harga</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
              {filteredReceipts.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    animationDelay: `${Math.min(index * 35, 350)}ms`,
                  }}
                  className="barang-masuk-row hover:bg-teal-50 dark:hover:bg-teal-950/20"
                >
                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-slate-100">
                      {item.transactionNumber}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                      {formatDate(item.receiptDate)}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                    {item.supplierName}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">
                    {item.Item?.name || "-"}
                  </td>

                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                    {item.quantity}
                  </td>

                  <td className="px-6 py-4 text-gray-600 dark:text-[#a7b4c7]">
                    {formatCurrency(item.totalPrice)}
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

              {filteredReceipts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500 dark:text-[#a7b4c7]"
                  >
                    {listLoading ? (
                      "Memuat data barang masuk..."
                    ) : listError ? (
                      <div>
                        <p className="mb-3">{listError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setListLoading(true);
                            void getReceipts();
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                        >
                          Coba lagi
                        </button>
                      </div>
                    ) : receipts.length === 0 ? (
                      <div>
                        <p className="mb-3">Belum ada data barang masuk.</p>
                        {canManage && (
                          <button
                            type="button"
                            onClick={openCreate}
                            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                          >
                            Tambah barang masuk pertama
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
            aria-labelledby="receipt-modal-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white dark:bg-[#111c2e] shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-[#263449] px-6 py-4">
              <div>
                <h2
                  id="receipt-modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-slate-100"
                >
                  Tambah Barang Masuk
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-[#a7b4c7]">
                  Stok barang otomatis bertambah setelah transaksi disimpan.
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
                  <label htmlFor="receipt-number" className={labelClass}>
                    No. Transaksi
                  </label>
                  <input
                    id="receipt-number"
                    type="text"
                    readOnly
                    value={transactionNumber}
                    placeholder="Dibuat otomatis saat disimpan"
                    className={readOnlyClass}
                  />
                </div>

                <div>
                  <label htmlFor="receipt-date" className={labelClass}>
                    Tanggal Barang Masuk
                  </label>
                  <input
                    id="receipt-date"
                    type="date"
                    value={receiptDate}
                    onChange={(event) => setReceiptDate(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="receipt-supplier" className={labelClass}>
                    Nama Supplier
                  </label>
                  <input
                    id="receipt-supplier"
                    type="text"
                    list="receipt-supplier-list"
                    maxLength={150}
                    autoFocus
                    value={supplierName}
                    onChange={(event) => setSupplierName(event.target.value)}
                    placeholder="Contoh: CV Sumber Makmur"
                    className={inputClass}
                  />
                  <datalist id="receipt-supplier-list">
                    {supplierSuggestions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="receipt-sender" className={labelClass}>
                    Nama Pengirim
                  </label>
                  <input
                    id="receipt-sender"
                    type="text"
                    list="receipt-sender-list"
                    maxLength={150}
                    value={senderName}
                    onChange={(event) => setSenderName(event.target.value)}
                    placeholder="Contoh: Budi"
                    className={inputClass}
                  />
                  <datalist id="receipt-sender-list">
                    {senderSuggestions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="receipt-item" className={labelClass}>
                  Nama Barang
                </label>
                <select
                  id="receipt-item"
                  value={itemId}
                  onChange={(event) => setItemId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Pilih barang</option>
                  {barang.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} (stok {option.stock ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="receipt-quantity" className={labelClass}>
                    Jumlah Masuk
                  </label>
                  <input
                    id="receipt-quantity"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder="Contoh: 20"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="receipt-price" className={labelClass}>
                    Harga Beli / Satuan
                  </label>
                  <input
                    id="receipt-price"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={unitPrice}
                    onChange={(event) => setUnitPrice(event.target.value)}
                    placeholder="Contoh: 35000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="receipt-total" className={labelClass}>
                    Total Harga
                  </label>
                  <input
                    id="receipt-total"
                    type="text"
                    readOnly
                    value={totalPrice === null ? "" : formatCurrency(totalPrice)}
                    placeholder="Otomatis"
                    className={readOnlyClass}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="receipt-notes" className={labelClass}>
                  Catatan (opsional)
                </label>
                <textarea
                  id="receipt-notes"
                  rows={3}
                  maxLength={500}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Contoh: nomor surat jalan, kondisi barang, dll."
                  className={inputClass}
                />
              </div>

              {nextStock !== null && (
                <p className="mb-4 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800 dark:bg-teal-950/30 dark:text-teal-200">
                  Stok {selectedItem?.name} akan bertambah dari{" "}
                  {selectedItem?.stock ?? 0} menjadi {nextStock}.
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
                  {saving ? "Menyimpan..." : "Simpan Barang Masuk"}
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
            aria-labelledby="receipt-detail-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white dark:bg-[#111c2e] shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-[#263449] px-6 py-4">
              <div>
                <h2
                  id="receipt-detail-title"
                  className="text-lg font-semibold text-gray-900 dark:text-slate-100"
                >
                  Detail Barang Masuk
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
                    Jumlah
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-slate-100">
                    {detail.quantity}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-[#263449] px-3 py-3">
                  <p className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                    Harga Beli
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {formatCurrency(detail.unitPrice)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-[#263449] px-3 py-3">
                  <p className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                    Total Harga
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {formatCurrency(detail.totalPrice)}
                  </p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-[#a7b4c7]">
                    Tanggal Barang Masuk
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-slate-100">
                    {formatDate(detail.receiptDate)}
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
                    Supplier
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-slate-100">
                    {detail.supplierName}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500 dark:text-[#a7b4c7]">
                    Pengirim
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-slate-100">
                    {detail.senderName}
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

export default BarangMasuk;
