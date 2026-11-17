import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  StickyNote,
  User,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import IconBadge from "../components/IconBadge";
import { useLanguage } from "../context/LanguageContext";

interface TagihanData {
  id: string;
  amount: number;
  status: string;
  Student?: {
    id: string;
    nis: string;
    name: string;
  };
  Item?: {
    id: string;
    name: string;
    price: number;
  };
}

interface PembayaranData {
  id: string;
  billId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes: string | null;
  Bill?: {
    id: string;
    studentId: string;
    itemId: string;
    amount: number;
    status: string;
    Student?: {
      id: string;
      nis: string;
      name: string;
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
    };
    Item?: {
      id: string;
      name: string;
      price: number;
    };
  };
  User?: {
    id: string;
    name: string;
    email: string;
  };
}

const METHODS = ["Tunai", "Transfer"];

const fieldClass =
  "rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2 text-sm";

function methodBadge(method: string) {
  return method === "Tunai"
    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
    : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
}

function dateOnly(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function Payment() {
  const { formatCurrency, formatDate } = useLanguage();
  const [tagihan, setTagihan] = useState<TagihanData[]>([]);
  const [pembayaran, setPembayaran] = useState<PembayaranData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  // filter
  const [search, setSearch] = useState("");
  const [kelas, setKelas] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [metode, setMetode] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // modal
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<PembayaranData | null>(null);

  // form tambah
  const [billId, setBillId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function getTagihan() {
    try {
      const response = await api.get("/bills");
      setTagihan(response.data);
    } catch (error) {
      console.error("Gagal mengambil data tagihan", error);
    }
  }

  async function getPembayaran() {
    try {
      const response = await api.get("/payments");
      setPembayaran(response.data);
    } catch (error) {
      console.error("Gagal mengambil data pembayaran", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void getTagihan();
    void getPembayaran();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Esc menutup modal
  useEffect(() => {
    if (!addOpen && !detail) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (saving) return;
      setAddOpen(false);
      setDetail(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [addOpen, detail, saving]);

  const kelasOptions = useMemo(
    () =>
      [
        ...new Set(
          pembayaran
            .map((item) => item.Bill?.Student?.Class?.name)
            .filter(Boolean),
        ),
      ] as string[],
    [pembayaran],
  );

  const jurusanOptions = useMemo(
    () =>
      [
        ...new Set(
          pembayaran
            .map((item) => item.Bill?.Student?.Jurusan?.nama)
            .filter(Boolean),
        ),
      ] as string[],
    [pembayaran],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pembayaran.filter((item) => {
      const student = item.Bill?.Student;
      const date = dateOnly(item.paymentDate);
      return (
        (!query ||
          `${student?.name || ""} ${student?.nis || ""}`
            .toLowerCase()
            .includes(query)) &&
        (!kelas || student?.Class?.name === kelas) &&
        (!jurusan || student?.Jurusan?.nama === jurusan) &&
        (!metode || item.paymentMethod === metode) &&
        (!dari || date >= dari) &&
        (!sampai || date <= sampai)
      );
    });
  }, [pembayaran, search, kelas, jurusan, metode, dari, sampai]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const totalNominal = filtered.reduce((sum, item) => sum + item.amount, 0);

  const chips: [string, string][] = [
    search ? ["search", `Cari: ${search}`] : ["", ""],
    kelas ? ["kelas", `Kelas: ${kelas}`] : ["", ""],
    jurusan ? ["jurusan", `Jurusan: ${jurusan}`] : ["", ""],
    metode ? ["metode", `Metode: ${metode}`] : ["", ""],
    dari ? ["dari", `Dari: ${formatDate(dari)}`] : ["", ""],
    sampai ? ["sampai", `Sampai: ${formatDate(sampai)}`] : ["", ""],
  ];

  function removeFilter(key: string) {
    if (key === "search") setSearch("");
    if (key === "kelas") setKelas("");
    if (key === "jurusan") setJurusan("");
    if (key === "metode") setMetode("");
    if (key === "dari") setDari("");
    if (key === "sampai") setSampai("");
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setKelas("");
    setJurusan("");
    setMetode("");
    setDari("");
    setSampai("");
    setPage(1);
  }

  function handleBillChange(value: string) {
    setBillId(value);
    const selectedBill = tagihan.find((item) => item.id === value);
    setAmount(selectedBill ? String(selectedBill.amount) : "");
  }

  function resetForm() {
    setBillId("");
    setAmount("");
    setPaymentMethod("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setFormError("");
  }

  function openAdd() {
    resetForm();
    setAddOpen(true);
  }

  function closeAdd() {
    if (saving) return;
    setAddOpen(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    if (!billId || !amount || !paymentMethod || !paymentDate) {
      setFormError("Data pembayaran belum lengkap.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/payments", {
        billId,
        amount: Number(amount),
        paymentMethod,
        paymentDate,
        notes,
      });

      setAddOpen(false);
      resetForm();
      setNotice("Pembayaran berhasil diproses.");
      await getTagihan();
      await getPembayaran();
    } catch (error: any) {
      console.error(error);
      setFormError(
        error.response?.data?.message || "Gagal memproses pembayaran.",
      );
    } finally {
      setSaving(false);
    }
  }

  const tagihanBelumBayar = tagihan.filter(
    (item) => item.status === "Belum Bayar",
  );

  const detailStudent = detail?.Bill?.Student;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          className="mb-0"
          title="Pembayaran"
          description="Kelola pembayaran tagihan siswa"
          icon={Wallet}
        />
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Tambah Pembayaran
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700 dark:border-green-900/70 dark:bg-green-950/40 dark:text-green-300"
        >
          {notice}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-[#111c2e] p-4 shadow-sm">
          <IconBadge icon={Receipt} tone="teal" />
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-[#a7b4c7]">
              Jumlah Transaksi
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {filtered.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-[#111c2e] p-4 shadow-sm">
          <IconBadge icon={Wallet} tone="green" />
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-[#a7b4c7]">
              Total Nominal
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {formatCurrency(totalNominal)}
            </p>
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-xl bg-white dark:bg-[#111c2e] shadow-sm">
        <div className="border-b border-gray-200 dark:border-[#263449] p-4">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Riwayat Pembayaran
            </h2>
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-500 dark:text-blue-300" />
              <input
                aria-label="Cari nama atau NIS"
                placeholder="Cari nama atau NIS..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-[#263449] py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <select
              value={kelas}
              onChange={(event) => {
                setKelas(event.target.value);
                setPage(1);
              }}
              className={fieldClass}
            >
              <option value="">Semua kelas</option>
              {kelasOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={jurusan}
              onChange={(event) => {
                setJurusan(event.target.value);
                setPage(1);
              }}
              className={fieldClass}
            >
              <option value="">Semua jurusan</option>
              {jurusanOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={metode}
              onChange={(event) => {
                setMetode(event.target.value);
                setPage(1);
              }}
              className={fieldClass}
            >
              <option value="">Semua metode</option>
              {METHODS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              type="date"
              aria-label="Dari tanggal"
              title="Dari tanggal"
              value={dari}
              onChange={(event) => {
                setDari(event.target.value);
                setPage(1);
              }}
              className={fieldClass}
            />
            <input
              type="date"
              aria-label="Sampai tanggal"
              title="Sampai tanggal"
              value={sampai}
              onChange={(event) => {
                setSampai(event.target.value);
                setPage(1);
              }}
              className={fieldClass}
            />
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2 text-sm font-medium text-gray-700 dark:text-[#a7b4c7]"
            >
              <SlidersHorizontal className="h-4 w-4" /> Reset Filter
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-[#a7b4c7]">
              Menampilkan{" "}
              {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, filtered.length)} dari{" "}
              {filtered.length} pembayaran
            </span>
            {chips.map(
              ([key, label]) =>
                label && (
                  <button
                    key={key}
                    type="button"
                    onClick={() => removeFilter(key)}
                    className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                  >
                    {label}
                    <X className="h-3 w-3" />
                  </button>
                ),
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500 dark:text-[#a7b4c7]">
              Memuat data pembayaran...
            </div>
          ) : (
            <table className="w-full min-w-212.5 text-left text-sm">
              <thead className="bg-gray-50 dark:bg-[#1b2a3d] text-xs uppercase text-gray-500 dark:text-[#a7b4c7]">
                <tr>
                  <th className="px-5 py-3">No</th>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Nama Siswa</th>
                  <th className="px-5 py-3">Kelas</th>
                  <th className="px-5 py-3">Nominal</th>
                  <th className="px-5 py-3">Metode</th>
                  <th className="px-5 py-3">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-[#263449]">
                {pageItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#1b2a3d]"
                  >
                    <td className="px-5 py-3 text-gray-500 dark:text-[#a7b4c7]">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {formatDate(item.paymentDate)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900 dark:text-slate-100">
                        {item.Bill?.Student?.name || "-"}
                      </div>
                      {item.Bill?.Student?.nis && (
                        <div className="text-xs text-gray-500 dark:text-[#a7b4c7]">
                          NIS: {item.Bill.Student.nis}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-[#a7b4c7]">
                      {item.Bill?.Student?.Class?.name || "-"}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-slate-100">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${methodBadge(item.paymentMethod)}`}
                      >
                        {item.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setDetail(item)}
                        aria-label={`Lihat detail pembayaran ${item.Bill?.Student?.name || ""}`}
                        title="Lihat detail pembayaran"
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/60"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {!pageItems.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-gray-500 dark:text-[#a7b4c7]"
                    >
                      <p>
                        {pembayaran.length
                          ? "Tidak ada pembayaran yang cocok dengan filter."
                          : "Belum ada riwayat pembayaran."}
                      </p>
                      {pembayaran.length > 0 && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-3 font-medium text-teal-600"
                        >
                          Reset Filter
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 dark:border-[#263449] px-5 py-3">
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded border border-gray-300 dark:border-[#263449] px-2 py-1 text-sm"
          >
            <option value={10}>10 / halaman</option>
            <option value={25}>25 / halaman</option>
            <option value={50}>50 / halaman</option>
          </select>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded border border-gray-300 dark:border-[#263449] p-1 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              Halaman {currentPage} dari {pageCount}
            </span>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
              className="rounded border border-gray-300 dark:border-[#263449] p-1 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal tambah pembayaran */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={closeAdd}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tambah pembayaran"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-[#111c2e]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-[#263449]">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Tambah Pembayaran
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-[#a7b4c7]">
                  Pilih tagihan yang belum dibayar, nominal terisi otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAdd}
                aria-label="Tutup"
                className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1b2a3d]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
                {formError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300 md:col-span-2"
                  >
                    {formError}
                  </div>
                )}

                <select
                  value={billId}
                  onChange={(event) => handleBillChange(event.target.value)}
                  className={`${fieldClass} md:col-span-2`}
                >
                  <option value="">Pilih tagihan</option>
                  {tagihanBelumBayar.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.Student?.nis} - {item.Student?.name} -{" "}
                      {item.Item?.name} - {formatCurrency(item.amount)}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={amount}
                  readOnly
                  placeholder="Nominal pembayaran"
                  className="rounded-lg border border-gray-300 dark:border-[#263449] bg-gray-50 dark:bg-[#1b2a3d] px-3 py-2 text-sm text-gray-600 dark:text-[#a7b4c7] outline-none"
                />

                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Pilih metode pembayaran</option>
                  {METHODS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  className={`${fieldClass} md:col-span-2`}
                />

                <textarea
                  placeholder="Catatan (opsional)"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className={`${fieldClass} md:col-span-2`}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 p-5 dark:border-[#263449]">
                <button
                  type="button"
                  onClick={closeAdd}
                  disabled={saving}
                  className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed dark:bg-[#1b2a3d] dark:text-[#a7b4c7]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Memproses..." : "Proses Pembayaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detail pembayaran */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Detail pembayaran"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-[#111c2e]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-[#263449]">
              <div className="flex items-center gap-3">
                <IconBadge icon={Receipt} tone="teal" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    Detail Pembayaran
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-[#a7b4c7]">
                    {formatDate(detail.paymentDate)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Tutup"
                className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1b2a3d]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between rounded-lg bg-teal-50 px-4 py-3 dark:bg-teal-950/30">
                <div>
                  <p className="text-xs uppercase text-teal-700 dark:text-teal-300">
                    Nominal Dibayar
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                    {formatCurrency(detail.amount)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${methodBadge(detail.paymentMethod)}`}
                >
                  {detail.paymentMethod}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem
                  icon={User}
                  label="Nama Siswa"
                  value={detailStudent?.name}
                />
                <DetailItem icon={Receipt} label="NIS" value={detailStudent?.nis} />
                <DetailItem
                  icon={GraduationCap}
                  label="Kelas"
                  value={detailStudent?.Class?.name}
                />
                <DetailItem
                  icon={BookOpen}
                  label="Jurusan"
                  value={detailStudent?.Jurusan?.nama}
                />
                <DetailItem
                  icon={Wallet}
                  label="Tagihan"
                  value={detail.Bill?.Item?.name}
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Tanggal Bayar"
                  value={formatDate(detail.paymentDate)}
                />
              </div>
              <DetailItem
                icon={UserCheck}
                label="Dicatat oleh"
                value={detail.User?.name}
              />
              <DetailItem
                icon={StickyNote}
                label="Catatan"
                value={detail.notes}
              />
            </div>

            <div className="flex justify-end border-t border-gray-200 p-5 dark:border-[#263449]">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 dark:bg-[#1b2a3d] dark:text-[#a7b4c7]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-[#263449]">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300" />
      <div className="min-w-0">
        <p className="text-xs uppercase text-gray-500 dark:text-[#a7b4c7]">
          {label}
        </p>
        <p className="wrap-break-word text-sm font-medium text-gray-900 dark:text-slate-100">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

export default Payment;