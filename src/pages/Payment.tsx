import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
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
import * as XLSX from "xlsx-js-style";
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
  "um-input rounded-lg border border-gray-300 dark:border-[#263449] bg-white dark:bg-[#111c2e] px-3 py-2 text-sm outline-none";

function methodBadge(method: string) {
  return method === "Tunai"
    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
    : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
}

function dateOnly(value?: string) {
  return value ? value.slice(0, 10) : "";
}

/* ------------------------------------------------------------------ */
/* Animasi                                                             */
/* ------------------------------------------------------------------ */

/*
  Semua animasi ada di sini supaya file ini tetap single-file.
  Daftar animasi:
  1.  Fade Up          -> .um-fade-up
  2.  Fade In          -> .um-fade-in
  3.  Stagger          -> variabel --um-delay (header, kartu, tabel, dll)
  4.  Row Fade In      -> .um-row-in
  5.  Card Hover       -> .um-card
  6.  Row Hover        -> .um-row
  7.  Button Hover     -> .um-btn
  8.  Button Press     -> .um-btn:active (scale)
  9.  Input Focus      -> .um-input
  10. Badge Hover      -> .um-badge
  11. Loading Spinner  -> .um-spinner
  12. Reduced Motion   -> @media (prefers-reduced-motion: reduce)
  Tambahan: Alert Slide Down (.um-alert), Modal Backdrop (.um-backdrop),
  Modal Pop (.um-modal), Detail Item Stagger.
*/
const ANIMATION_CSS = `
.um-root {
  --um-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

/* 1. Fade Up */
@keyframes um-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
.um-fade-up {
  animation: um-fade-up 0.5s var(--um-ease) backwards;
  animation-delay: var(--um-delay, 0ms);
}

/* 2. Fade In */
@keyframes um-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.um-fade-in {
  animation: um-fade-in 0.4s ease-out backwards;
  animation-delay: var(--um-delay, 0ms);
}

/* 4. Row Fade In (dipakai bersama stagger lewat --um-delay) */
@keyframes um-row-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.um-row-in {
  animation: um-row-in 0.4s var(--um-ease) backwards;
  animation-delay: var(--um-delay, 0ms);
}

/* Alert / notice slide down */
@keyframes um-alert {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.um-alert {
  animation: um-alert 0.3s var(--um-ease) backwards;
}

/* Modal backdrop + pop */
@keyframes um-backdrop {
  from { opacity: 0; }
  to { opacity: 1; }
}
.um-backdrop {
  animation: um-backdrop 0.2s ease-out backwards;
}
@keyframes um-modal {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.um-modal {
  animation: um-modal 0.3s var(--um-ease) backwards;
}

/* 5. Card Hover */
.um-card {
  transition: transform 0.25s var(--um-ease), box-shadow 0.25s var(--um-ease),
    border-color 0.25s ease;
}
@media (hover: hover) {
  .um-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px -12px rgba(15, 23, 42, 0.25);
  }
}

/* 6. Row Hover */
.um-row {
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}
@media (hover: hover) {
  .um-row:hover {
    box-shadow: inset 3px 0 0 #20b2aa;
  }
}

/* 7. Button Hover + 8. Button Press */
.um-btn {
  transition: transform 0.18s var(--um-ease), background-color 0.18s ease,
    box-shadow 0.18s ease, opacity 0.18s ease;
}
@media (hover: hover) {
  .um-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px -6px rgba(22, 139, 135, 0.55);
  }
}
.um-btn:not(:disabled):active {
  transform: scale(0.95);
  box-shadow: none;
}
.um-btn:focus-visible {
  outline: 2px solid #20b2aa;
  outline-offset: 2px;
}

/* 9. Input Focus */
.um-input {
  transition: border-color 0.2s ease, box-shadow 0.2s ease,
    background-color 0.2s ease;
}
.um-input:focus {
  border-color: #20b2aa;
  box-shadow: 0 0 0 3px rgba(32, 178, 170, 0.22);
}

/* 10. Badge Hover */
.um-badge {
  transition: transform 0.2s var(--um-ease), box-shadow 0.2s ease;
}
@media (hover: hover) {
  .um-badge:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 10px -4px rgba(22, 139, 135, 0.5);
  }
}

/* 11. Loading Spinner */
@keyframes um-spin {
  to { transform: rotate(360deg); }
}
.um-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: um-spin 0.7s linear infinite;
}

/* Pulse teks loading */
@keyframes um-pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
.um-pulse {
  animation: um-pulse 1.4s ease-in-out infinite;
}

/* 12. Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .um-root *,
  .um-root *::before,
  .um-root *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
    scroll-behavior: auto !important;
  }
  .um-card:hover,
  .um-btn:hover,
  .um-btn:active,
  .um-badge:hover {
    transform: none !important;
  }
  .um-spinner {
    animation: none !important;
    border-right-color: currentColor;
    opacity: 0.6;
  }
}
`;

/* Stagger helper: delay naik per index, dibatasi supaya tidak kelamaan */
function stagger(index: number, base = 0, step = 45, max = 12): CSSProperties {
  return {
    "--um-delay": `${base + Math.min(index, max) * step}ms`,
  } as CSSProperties;
}

/* ------------------------------------------------------------------ */
/* Export Excel                                                        */
/* ------------------------------------------------------------------ */

const EXPORT_SHEET_NAME = "Riwayat Pembayaran";
const EXPORT_TITLE = "LAPORAN RIWAYAT PEMBAYARAN";
const CURRENCY_FORMAT = '"Rp" #,##0';

interface ExportColumn {
  header: string;
  width: number;
  align?: "left" | "center" | "right";
  currency?: boolean;
  wrap?: boolean;
  value: (
    item: PembayaranData,
    index: number,
    formatDate: (value: string) => string,
  ) => string | number;
}

// Urutan grup harus sama dengan urutan kolom pada EXPORT_COLUMNS.
const EXPORT_GROUPS = [
  { label: "A. Informasi Transaksi", span: 6 },
  { label: "B. Informasi Siswa", span: 2 },
  { label: "C. Informasi Akademik", span: 5 },
  { label: "D. Informasi Tagihan", span: 5 },
  { label: "E. Informasi Pencatatan", span: 2 },
];

function dash(value: unknown): string {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text ? text : "-";
}

function numberOrDash(value: unknown): number | string {
  return typeof value === "number" && Number.isFinite(value) ? value : "-";
}

const EXPORT_COLUMNS: ExportColumn[] = [
  // A. Informasi Transaksi
  { header: "No", width: 6, align: "center", value: (_item, index) => index + 1 },
  { header: "ID Pembayaran", width: 38, value: (item) => dash(item.id) },
  {
    header: "Tanggal Pembayaran",
    width: 20,
    align: "center",
    value: (item, _index, formatDate) =>
      item.paymentDate ? dash(formatDate(item.paymentDate)) : "-",
  },
  {
    header: "Nominal Dibayar",
    width: 20,
    align: "right",
    currency: true,
    value: (item) => numberOrDash(item.amount),
  },
  {
    header: "Metode Pembayaran",
    width: 20,
    align: "center",
    value: (item) => dash(item.paymentMethod),
  },
  { header: "Catatan", width: 34, wrap: true, value: (item) => dash(item.notes) },

  // B. Informasi Siswa
  {
    header: "Nama Siswa",
    width: 28,
    value: (item) => dash(item.Bill?.Student?.name),
  },
  { header: "NIS", width: 16, value: (item) => dash(item.Bill?.Student?.nis) },

  // C. Informasi Akademik
  {
    header: "Kelas",
    width: 16,
    value: (item) => dash(item.Bill?.Student?.Class?.name),
  },
  {
    header: "Tingkat Kelas",
    width: 16,
    align: "center",
    value: (item) => dash(item.Bill?.Student?.Class?.level),
  },
  {
    header: "Tahun Ajaran",
    width: 16,
    align: "center",
    value: (item) => dash(item.Bill?.Student?.Class?.academicYear),
  },
  {
    header: "Jurusan",
    width: 30,
    value: (item) => dash(item.Bill?.Student?.Jurusan?.nama),
  },
  {
    header: "Kode Jurusan",
    width: 16,
    align: "center",
    value: (item) => dash(item.Bill?.Student?.Jurusan?.kode),
  },

  // D. Informasi Tagihan
  { header: "ID Tagihan", width: 38, value: (item) => dash(item.Bill?.id) },
  {
    header: "Nama Barang",
    width: 28,
    value: (item) => dash(item.Bill?.Item?.name),
  },
  {
    header: "Harga Barang",
    width: 20,
    align: "right",
    currency: true,
    value: (item) => numberOrDash(item.Bill?.Item?.price),
  },
  {
    header: "Total Tagihan",
    width: 20,
    align: "right",
    currency: true,
    value: (item) => numberOrDash(item.Bill?.amount),
  },
  {
    header: "Status Tagihan",
    width: 18,
    align: "center",
    value: (item) => dash(item.Bill?.status),
  },

  // E. Informasi Pencatatan
  {
    header: "Nama Petugas yang Mencatat",
    width: 28,
    value: (item) => dash(item.User?.name),
  },
  { header: "Email Petugas", width: 32, value: (item) => dash(item.User?.email) },
];

const EXPORT_COLUMN_COUNT = EXPORT_COLUMNS.length;
// Baris (0-based): 0 judul, 1 tanggal export, 2 filter, 3 ringkasan,
// 4 grup kolom, 5 header kolom, data mulai baris 6.
const EXPORT_GROUP_ROW = 4;
const EXPORT_HEADER_ROW = 5;
const EXPORT_DATA_START_ROW = 6;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function localDateString(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function localTimeString(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function singleCellRow(text: string): string[] {
  return [text, ...Array(EXPORT_COLUMN_COUNT - 1).fill("")];
}

const thinBorder = (rgb: string) => ({
  top: { style: "thin", color: { rgb } },
  bottom: { style: "thin", color: { rgb } },
  left: { style: "thin", color: { rgb } },
  right: { style: "thin", color: { rgb } },
});

interface ExportOptions {
  items: PembayaranData[];
  activeFilters: string[];
  totalNominalText: string;
  formatDate: (value: string) => string;
}

function buildPaymentWorkbook({
  items,
  activeFilters,
  totalNominalText,
  formatDate,
}: ExportOptions) {
  const now = new Date();
  const todayText = localDateString(now);

  const groupRow: string[] = [];
  EXPORT_GROUPS.forEach((group) => {
    groupRow.push(group.label);
    for (let i = 1; i < group.span; i += 1) groupRow.push("");
  });

  const rows: (string | number)[][] = [
    singleCellRow(EXPORT_TITLE),
    singleCellRow(
      `Tanggal export: ${formatDate(todayText)} ${localTimeString(now)}`,
    ),
    singleCellRow(
      activeFilters.length
        ? `Filter aktif: ${activeFilters.join(" | ")}`
        : "Filter aktif: Tidak ada (semua data)",
    ),
    singleCellRow(
      `Jumlah data: ${items.length} pembayaran | Total nominal: ${totalNominalText}`,
    ),
    groupRow,
    EXPORT_COLUMNS.map((column) => column.header),
    ...items.map((item, index) =>
      EXPORT_COLUMNS.map((column) => column.value(item, index, formatDate)),
    ),
  ];

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const lastRow = rows.length - 1;
  const lastCol = EXPORT_COLUMN_COUNT - 1;

  // Lebar kolom dan tinggi baris
  sheet["!cols"] = EXPORT_COLUMNS.map((column) => ({ wch: column.width }));
  sheet["!rows"] = [
    { hpt: 30 },
    { hpt: 18 },
    { hpt: 18 },
    { hpt: 18 },
    { hpt: 22 },
    { hpt: 26 },
  ];

  // Merge judul/info (A:T) dan baris grup
  const merges: XLSX.Range[] = [0, 1, 2, 3].map((row) => ({
    s: { r: row, c: 0 },
    e: { r: row, c: lastCol },
  }));
  let groupStart = 0;
  EXPORT_GROUPS.forEach((group) => {
    merges.push({
      s: { r: EXPORT_GROUP_ROW, c: groupStart },
      e: { r: EXPORT_GROUP_ROW, c: groupStart + group.span - 1 },
    });
    groupStart += group.span;
  });
  sheet["!merges"] = merges;

  // Autofilter pada header kolom
  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: EXPORT_HEADER_ROW, c: 0 },
      e: { r: Math.max(lastRow, EXPORT_HEADER_ROW), c: lastCol },
    }),
  };

  // Freeze sampai baris header
  (sheet as unknown as Record<string, unknown>)["!freeze"] = {
    xSplit: "0",
    ySplit: String(EXPORT_DATA_START_ROW),
    topLeftCell: `A${EXPORT_DATA_START_ROW + 1}`,
    activePane: "bottomLeft",
    state: "frozen",
  };

  // Styling
  for (let r = 0; r <= lastRow; r += 1) {
    for (let c = 0; c <= lastCol; c += 1) {
      const address = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[address];
      if (!cell) continue;

      if (r === 0) {
        cell.s = {
          font: { bold: true, sz: 16, color: { rgb: "0F766E" } },
          alignment: { horizontal: "left", vertical: "center" },
        };
      } else if (r >= 1 && r <= 3) {
        cell.s = {
          font: { sz: 10, color: { rgb: "475569" } },
          alignment: { horizontal: "left", vertical: "center" },
        };
      } else if (r === EXPORT_GROUP_ROW) {
        cell.s = {
          fill: { patternType: "solid", fgColor: { rgb: "134E4A" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: thinBorder("FFFFFF"),
        };
      } else if (r === EXPORT_HEADER_ROW) {
        cell.s = {
          fill: { patternType: "solid", fgColor: { rgb: "0F766E" } },
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: thinBorder("FFFFFF"),
        };
      } else {
        const column = EXPORT_COLUMNS[c];
        cell.s = {
          font: { sz: 10 },
          alignment: {
            horizontal: column.align || "left",
            vertical: "center",
            wrapText: Boolean(column.wrap),
          },
          border: thinBorder("CBD5E1"),
        };
        if (column.currency && typeof cell.v === "number") {
          cell.t = "n";
          cell.z = CURRENCY_FORMAT;
        }
        if (column.header === "NIS") {
          cell.t = "s";
          cell.z = "@";
        }
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, EXPORT_SHEET_NAME);
  return { workbook, fileName: `Laporan_Pembayaran_${todayText}.xlsx` };
}

/* ------------------------------------------------------------------ */

function Payment() {
  const { formatCurrency, formatDate } = useLanguage();
  const [tagihan, setTagihan] = useState<TagihanData[]>([]);
  const [pembayaran, setPembayaran] = useState<PembayaranData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [exportError, setExportError] = useState("");

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

  useEffect(() => {
    if (!exportError) return;
    const timer = window.setTimeout(() => setExportError(""), 5000);
    return () => window.clearTimeout(timer);
  }, [exportError]);

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

  function exportExcel() {
    setExportError("");
    if (!filtered.length) {
      setNotice("");
      setExportError(
        pembayaran.length
          ? "Tidak ada pembayaran yang cocok dengan filter, jadi tidak ada data untuk diekspor."
          : "Belum ada riwayat pembayaran untuk diekspor.",
      );
      return;
    }

    try {
      const { workbook, fileName } = buildPaymentWorkbook({
        items: filtered,
        activeFilters: chips.map(([, label]) => label).filter(Boolean),
        totalNominalText: formatCurrency(totalNominal),
        formatDate,
      });
      XLSX.writeFile(workbook, fileName);
      setNotice(`Export berhasil: ${filtered.length} data pembayaran (${fileName}).`);
    } catch (error) {
      console.error("Gagal mengekspor data pembayaran", error);
      setNotice("");
      setExportError("Gagal mengekspor data pembayaran ke Excel.");
    }
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
    <div className="um-root">
      <style>{ANIMATION_CSS}</style>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="um-fade-up" style={stagger(0)}>
          <PageHeader
            className="mb-0"
            title="Pembayaran"
            description="Kelola pembayaran tagihan siswa"
            icon={Wallet}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportExcel}
            style={stagger(1, 0, 80)}
            className="um-btn um-fade-up inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={openAdd}
            style={stagger(2, 0, 80)}
            className="um-btn um-fade-up inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Pembayaran
          </button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="um-alert mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700 dark:border-green-900/70 dark:bg-green-950/40 dark:text-green-300"
        >
          {notice}
        </div>
      )}

      {exportError && (
        <div
          role="alert"
          className="um-alert mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
        >
          {exportError}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          style={stagger(2, 0, 80)}
          className="um-card um-fade-up flex items-center gap-3 rounded-xl bg-white dark:bg-[#111c2e] p-4 shadow-sm"
        >
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
        <div
          style={stagger(3, 0, 80)}
          className="um-card um-fade-up flex items-center gap-3 rounded-xl bg-white dark:bg-[#111c2e] p-4 shadow-sm"
        >
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

      <div
        style={stagger(4, 0, 80)}
        className="um-card um-fade-up min-w-0 rounded-xl bg-white dark:bg-[#111c2e] shadow-sm"
      >
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
                className="um-input w-full rounded-lg border border-gray-300 dark:border-[#263449] py-2 pl-9 pr-3 text-sm outline-none"
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
              className="um-btn inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-[#263449] px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-[#a7b4c7] dark:hover:bg-[#1b2a3d]"
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
                    className="um-badge um-fade-in inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
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
              <span className="um-fade-in inline-flex items-center gap-2">
                <span
                  className="um-spinner text-teal-600 dark:text-teal-300"
                  aria-hidden="true"
                />
                <span className="um-pulse">Memuat data pembayaran...</span>
              </span>
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
                    style={stagger(index, 80)}
                    className="um-row um-row-in hover:bg-gray-50 dark:hover:bg-[#1b2a3d]"
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
                        className={`um-badge inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${methodBadge(item.paymentMethod)}`}
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
                        className="um-btn inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-900/60"
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
                      <div className="um-fade-in">
                        <p>
                          {pembayaran.length
                            ? "Tidak ada pembayaran yang cocok dengan filter."
                            : "Belum ada riwayat pembayaran."}
                        </p>
                        {pembayaran.length > 0 && (
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="um-btn mt-3 rounded-md px-2 py-1 font-medium text-teal-600"
                          >
                            Reset Filter
                          </button>
                        )}
                      </div>
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
            className="um-input rounded border border-gray-300 dark:border-[#263449] px-2 py-1 text-sm outline-none"
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
              aria-label="Halaman sebelumnya"
              className="um-btn rounded border border-gray-300 dark:border-[#263449] p-1 disabled:opacity-40"
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
              aria-label="Halaman berikutnya"
              className="um-btn rounded border border-gray-300 dark:border-[#263449] p-1 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal tambah pembayaran */}
      {addOpen && (
        <div
          className="um-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={closeAdd}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tambah pembayaran"
            className="um-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-[#111c2e]"
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
                className="um-btn cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1b2a3d]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
                {formError && (
                  <div
                    role="alert"
                    className="um-alert rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300 md:col-span-2"
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
                  className="um-btn cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed dark:bg-[#1b2a3d] dark:text-[#a7b4c7] dark:hover:bg-[#223449]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="um-btn inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <span className="um-spinner" aria-hidden="true" />}
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
          className="um-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Detail pembayaran"
            className="um-modal max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-[#111c2e]"
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
                className="um-btn cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1b2a3d]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div
                className="um-fade-up flex items-center justify-between rounded-lg bg-teal-50 px-4 py-3 dark:bg-teal-950/30"
                style={stagger(0, 80, 50)}
              >
                <div>
                  <p className="text-xs uppercase text-teal-700 dark:text-teal-300">
                    Nominal Dibayar
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                    {formatCurrency(detail.amount)}
                  </p>
                </div>
                <span
                  className={`um-badge rounded-full px-2.5 py-1 text-xs font-semibold ${methodBadge(detail.paymentMethod)}`}
                >
                  {detail.paymentMethod}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem
                  icon={User}
                  label="Nama Siswa"
                  value={detailStudent?.name}
                  index={1}
                />
                <DetailItem
                  icon={Receipt}
                  label="NIS"
                  value={detailStudent?.nis}
                  index={2}
                />
                <DetailItem
                  icon={GraduationCap}
                  label="Kelas"
                  value={detailStudent?.Class?.name}
                  index={3}
                />
                <DetailItem
                  icon={BookOpen}
                  label="Jurusan"
                  value={detailStudent?.Jurusan?.nama}
                  index={4}
                />
                <DetailItem
                  icon={Wallet}
                  label="Tagihan"
                  value={detail.Bill?.Item?.name}
                  index={5}
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Tanggal Bayar"
                  value={formatDate(detail.paymentDate)}
                  index={6}
                />
              </div>
              <DetailItem
                icon={UserCheck}
                label="Dicatat oleh"
                value={detail.User?.name}
                index={7}
              />
              <DetailItem
                icon={StickyNote}
                label="Catatan"
                value={detail.notes}
                index={8}
              />
            </div>

            <div className="flex justify-end border-t border-gray-200 p-5 dark:border-[#263449]">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="um-btn cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-[#1b2a3d] dark:text-[#a7b4c7] dark:hover:bg-[#223449]"
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
  index = 0,
}: {
  icon: typeof User;
  label: string;
  value?: string | null;
  index?: number;
}) {
  return (
    <div
      className="um-fade-up flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-[#263449]"
      style={stagger(index, 80, 50)}
    >
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