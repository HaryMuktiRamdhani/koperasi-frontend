import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  ReceiptText,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import { useLanguage } from "../context/LanguageContext";
import { getStoredRole } from "../utils/permissions";

interface Major {
  id: string;
  nama: string;
  kode: string;
}
interface ClassData {
  id: string;
  name: string;
  level: string;
  jurusanId?: string | null;
}
interface StudentData {
  id: string;
  nis: string;
  name: string;
  generation: string;
  status: string;
  classId: string;
  jurusanId: string;
  Class?: ClassData;
  Jurusan?: Major;
}
interface ItemData {
  id: string;
  name: string;
  price: number;
  status?: string;
}
interface BillData {
  id: string;
  studentId: string;
  itemId: string;
  amount: number;
  status: string;
  billDate?: string | null;
  dueDate?: string | null;
  Student?: StudentData;
  Item?: ItemData;
}
type SortKey = "student" | "item" | "amount" | "status" | "billDate";
type FilterState = {
  search: string;
  status: string;
  jurusan: string;
  level: string;
  classId: string;
  generation: string;
  itemId: string;
  min: string;
  max: string;
  billFrom: string;
  billTo: string;
  dueFrom: string;
  dueTo: string;
  overdue: boolean;
  sort: SortKey;
  direction: "asc" | "desc";
  page: number;
  pageSize: number;
};

const defaults: FilterState = {
  search: "",
  status: "",
  jurusan: "",
  level: "",
  classId: "",
  generation: "",
  itemId: "",
  min: "",
  max: "",
  billFrom: "",
  billTo: "",
  dueFrom: "",
  dueTo: "",
  overdue: false,
  sort: "billDate",
  direction: "desc",
  page: 1,
  pageSize: 10,
};
const dateValue = (value?: string | null) => (value ? value.slice(0, 10) : "");
const errorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } }).response?.data
    ?.message || fallback;

function readParams(params: URLSearchParams): FilterState {
  const next = { ...defaults };
  (Object.keys(next) as (keyof FilterState)[]).forEach((key) => {
    const value = params.get(key);
    if (value === null) return;
    if (key === "page" || key === "pageSize")
      next[key] = Number(value) as never;
    else if (key === "overdue") next[key] = (value === "1") as never;
    else next[key] = value as never;
  });
  if (!["student", "item", "amount", "status", "billDate"].includes(next.sort))
    next.sort = defaults.sort;
  if (!["asc", "desc"].includes(next.direction))
    next.direction = defaults.direction;
  if (![10, 25, 50].includes(next.pageSize)) next.pageSize = 10;
  next.page = Math.max(1, next.page || 1);
  return next;
}
function writeParams(filters: FilterState) {
  const params = new URLSearchParams();
  (
    Object.entries(filters) as [
      keyof FilterState,
      FilterState[keyof FilterState],
    ][]
  ).forEach(([key, value]) => {
    if (value !== "" && value !== false && value !== defaults[key])
      params.set(key, String(value));
  });
  if (filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize !== 10) params.set("pageSize", String(filters.pageSize));
  return params;
}

/* ------------------------------------------------------------------ */
/* Animasi                                                             */
/* ------------------------------------------------------------------ */

/*
  Semua animasi ada di sini supaya file ini tetap single-file.
  Daftar animasi:
  1.  Fade Up          -> .um-fade-up
  2.  Fade In          -> .um-fade-in
  3.  Stagger          -> variabel --um-delay (header, filter, kartu, baris)
  4.  Row Fade In      -> .um-row-in
  5.  Card Hover       -> .um-card
  6.  Row Hover        -> .um-row
  7.  Button Hover     -> .um-btn
  8.  Button Press     -> .um-btn:active (scale)
  9.  Input Focus      -> .um-input
  10. Badge Hover      -> .um-badge
  11. Loading Spinner  -> .um-spinner
  12. Reduced Motion   -> @media (prefers-reduced-motion: reduce)
  Tambahan: Alert Slide Down (.um-alert), Pulse teks loading (.um-pulse).

  Animasi masuk memakai fill-mode "backwards" supaya efek hover
  (transform) tetap jalan setelah animasi selesai.
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

/* 5. Card Hover */
.um-card {
  transition: transform 0.25s var(--um-ease), box-shadow 0.25s var(--um-ease),
    border-color 0.25s ease;
}
@media (hover: hover) {
  .um-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px -12px rgba(15, 23, 42, 0.25);
    border-color: rgba(32, 178, 170, 0.45);
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
    box-shadow 0.18s ease, opacity 0.18s ease, color 0.18s ease,
    border-color 0.18s ease;
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
/* Komponen kecil untuk layout filter                                  */
/* ------------------------------------------------------------------ */

const inputClass =
  "um-input w-full rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-2 text-sm outline-none";
const dateInputClass = `${inputClass} text-[#102a43] dark:text-slate-100`;

/* Satu kolom filter dengan label di atasnya */
function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-[#a7b4c7]">
        {label}
      </span>
      {children}
    </label>
  );
}

/* Kelompok filter dengan judul, keterangan singkat, dan aksi opsional */
function FilterGroup({
  title,
  description,
  action,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border border-slate-200 dark:border-[#263449] p-3 ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#102a43] dark:text-slate-100">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-[#a7b4c7]">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Bill() {
  const { formatCurrency, formatDate } = useLanguage();
  const canDelete = getStoredRole() === "admin";
  const formatRupiah = formatCurrency;
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readParams(searchParams));
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [bills, setBills] = useState<BillData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [items, setItems] = useState<ItemData[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentMajor, setStudentMajor] = useState("");
  const [studentLevel, setStudentLevel] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [itemId, setItemId] = useState("");
  const [amount, setAmount] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BillData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function updateFilters(patch: Partial<FilterState>, resetPage = true) {
    const next = { ...filters, ...patch, ...(resetPage ? { page: 1 } : {}) };
    setFilters(next);
    setSearchParams(writeParams(next), { replace: true });
  }
  useEffect(() => {
    const next = readParams(searchParams);
    setFilters(next);
    setSearchDraft(next.search);
  }, [searchParams]);
  useEffect(() => {
    if (searchDraft === filters.search) return;
    const timer = window.setTimeout(
      () => updateFilters({ search: searchDraft }),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [searchDraft, filters.search]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [
          billResponse,
          studentResponse,
          itemResponse,
          majorResponse,
          classResponse,
        ] = await Promise.all([
          api.get<BillData[]>("/bills"),
          api.get<StudentData[]>("/students"),
          api.get<ItemData[]>("/items"),
          api.get<Major[]>("/jurusan"),
          api.get<ClassData[]>("/classes"),
        ]);
        if (!cancelled) {
          setBills(billResponse.data);
          setStudents(studentResponse.data);
          setItems(itemResponse.data);
          setMajors(majorResponse.data);
          setClasses(classResponse.data);
        }
      } catch (loadError) {
        if (!cancelled)
          setError(errorMessage(loadError, "Data tagihan gagal dimuat."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableClasses = useMemo(
    () =>
      classes.filter(
        (item) =>
          (!filters.jurusan || item.jurusanId === filters.jurusan) &&
          (!filters.level || item.level === filters.level),
      ),
    [classes, filters.jurusan, filters.level],
  );
  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    return students.filter(
      (student) =>
        student.status === "Aktif" &&
        (!studentMajor || student.jurusanId === studentMajor) &&
        (!studentLevel || student.Class?.level === studentLevel) &&
        (!studentClass || student.classId === studentClass) &&
        (!query ||
          `${student.name} ${student.nis}`.toLowerCase().includes(query)),
    );
  }, [students, studentSearch, studentMajor, studentLevel, studentClass]);
  useEffect(() => {
    if (
      filters.classId &&
      !availableClasses.some((item) => item.id === filters.classId)
    ) {
      updateFilters({ classId: "" });
    }
  }, [availableClasses, filters.classId]);
  const filteredBills = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const result = bills.filter((bill) => {
      const student = bill.Student;
      const billDateValue = dateValue(bill.billDate);
      const dueDateValue = dateValue(bill.dueDate);
      const matchesSearch =
        !query ||
        `${student?.name || ""} ${student?.nis || ""} ${bill.Item?.name || ""}`
          .toLowerCase()
          .includes(query);
      const overdue = Boolean(
        dueDateValue &&
        dueDateValue < new Date().toISOString().slice(0, 10) &&
        bill.status !== "Lunas",
      );
      return (
        matchesSearch &&
        (!filters.status || bill.status === filters.status) &&
        (!filters.jurusan || student?.jurusanId === filters.jurusan) &&
        (!filters.level || student?.Class?.level === filters.level) &&
        (!filters.classId || student?.classId === filters.classId) &&
        (!filters.generation || student?.generation === filters.generation) &&
        (!filters.itemId || bill.itemId === filters.itemId) &&
        (!filters.min || bill.amount >= Number(filters.min)) &&
        (!filters.max || bill.amount <= Number(filters.max)) &&
        (!filters.billFrom ||
          (billDateValue && billDateValue >= filters.billFrom)) &&
        (!filters.billTo ||
          (billDateValue && billDateValue <= filters.billTo)) &&
        (!filters.dueFrom ||
          (dueDateValue && dueDateValue >= filters.dueFrom)) &&
        (!filters.dueTo || (dueDateValue && dueDateValue <= filters.dueTo)) &&
        (!filters.overdue || overdue)
      );
    });
    const direction = filters.direction === "asc" ? 1 : -1;
    return result.sort((a, b) => {
      const value =
        filters.sort === "student"
          ? (a.Student?.name || "").localeCompare(b.Student?.name || "")
          : filters.sort === "item"
            ? (a.Item?.name || "").localeCompare(b.Item?.name || "")
            : filters.sort === "amount"
              ? a.amount - b.amount
              : filters.sort === "status"
                ? a.status.localeCompare(b.status)
                : dateValue(a.billDate).localeCompare(dateValue(b.billDate));
      return value * direction;
    });
  }, [bills, filters]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredBills.length / filters.pageSize),
  );
  useEffect(() => {
    if (filters.page > totalPages) updateFilters({ page: totalPages }, false);
  }, [filters.page, totalPages]);
  const visibleBills = filteredBills.slice(
    (filters.page - 1) * filters.pageSize,
    filters.page * filters.pageSize,
  );
  const generations = [
    ...new Set(students.map((student) => student.generation)),
  ].filter(Boolean);
  const selectedItem = items.find((item) => item.id === itemId);
  const studentSelectionTotal = selectedStudents.length * Number(amount || 0);
  const hasFilters = (Object.keys(filters) as (keyof FilterState)[]).some(
    (key) =>
      filters[key] !== defaults[key] && key !== "page" && key !== "pageSize",
  );
  const resetFilters = () => {
    setSearchDraft("");
    const next = { ...defaults };
    setFilters(next);
    setSearchParams(writeParams(next), { replace: true });
  };
  const activeFilterChips: { key: keyof FilterState; label: string }[] = [
    filters.search && { key: "search", label: `Cari: ${filters.search}` },
    filters.status && { key: "status", label: `Status: ${filters.status}` },
    filters.jurusan && {
      key: "jurusan",
      label: `Jurusan: ${majors.find((item) => item.id === filters.jurusan)?.nama || filters.jurusan}`,
    },
    filters.level && { key: "level", label: `Tingkat: ${filters.level}` },
    filters.classId && {
      key: "classId",
      label: `Kelas: ${availableClasses.find((item) => item.id === filters.classId)?.name || filters.classId}`,
    },
    filters.generation && {
      key: "generation",
      label: `Angkatan: ${filters.generation}`,
    },
    filters.itemId && {
      key: "itemId",
      label: `Barang: ${items.find((item) => item.id === filters.itemId)?.name || filters.itemId}`,
    },
    filters.min && {
      key: "min",
      label: `Min: ${formatRupiah(Number(filters.min))}`,
    },
    filters.max && {
      key: "max",
      label: `Maks: ${formatRupiah(Number(filters.max))}`,
    },
    filters.billFrom && {
      key: "billFrom",
      label: `Tagihan dari: ${filters.billFrom}`,
    },
    filters.billTo && {
      key: "billTo",
      label: `Tagihan sampai: ${filters.billTo}`,
    },
    filters.dueFrom && {
      key: "dueFrom",
      label: `Jatuh tempo dari: ${filters.dueFrom}`,
    },
    filters.dueTo && {
      key: "dueTo",
      label: `Jatuh tempo sampai: ${filters.dueTo}`,
    },
    filters.overdue && { key: "overdue", label: "Terlambat" },
  ].filter(Boolean) as { key: keyof FilterState; label: string }[];

  function toggleSort(sort: SortKey) {
    updateFilters(
      {
        sort,
        direction:
          filters.sort === sort && filters.direction === "asc" ? "desc" : "asc",
      },
      false,
    );
  }
  function resetForm() {
    setFormOpen(false);
    setEditId(null);
    setSelectedStudents([]);
    setItemId("");
    setAmount("");
    setBillDate("");
    setDueDate("");
  }
  function startEdit(bill: BillData) {
    setFormOpen(true);
    setEditId(bill.id);
    setSelectedStudents([bill.studentId]);
    setItemId(bill.itemId);
    setAmount(String(bill.amount));
    setBillDate(dateValue(bill.billDate));
    setDueDate(dateValue(bill.dueDate));
  }
  function selectItem(value: string) {
    setItemId(value);
    const item = items.find((entry) => entry.id === value);
    if (item && (!amount || Number(amount) === selectedItem?.price))
      setAmount(String(item.price));
  }
  function toggleStudent(id: string) {
    setSelectedStudents((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!itemId || !amount || selectedStudents.length === 0) {
      setError("Pilih siswa, barang, dan nominal tagihan.");
      return;
    }
    setSaving(true);
    try {
      if (editId)
        await api.put(`/bills/${editId}`, {
          studentId: selectedStudents[0],
          itemId,
          amount: Number(amount),
          billDate: billDate || null,
          dueDate: dueDate || null,
        });
      else
        await api.post("/bills/bulk", {
          studentIds: selectedStudents,
          itemId,
          amount: Number(amount),
          billDate: billDate || null,
          dueDate: dueDate || null,
        });
      resetForm();
      setNotice(
        editId ? "Tagihan berhasil diperbarui." : "Tagihan berhasil dibuat.",
      );
      const response = await api.get<BillData[]>("/bills");
      setBills(response.data);
    } catch (saveError) {
      setError(errorMessage(saveError, "Gagal menyimpan tagihan."));
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await api.delete(`/bills/${deleteTarget.id}`);
      setDeleteTarget(null);
      setBills((current) =>
        current.filter((bill) => bill.id !== deleteTarget.id),
      );
    } catch (deleteError) {
      setDeleteError(errorMessage(deleteError, "Gagal menghapus tagihan."));
    } finally {
      setDeleteLoading(false);
    }
  }
  function SortHeader({ label, sort }: { label: string; sort: SortKey }) {
    const active = filters.sort === sort;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sort)}
        className="um-btn inline-flex cursor-pointer items-center gap-1 rounded px-1 font-semibold"
      >
        {label}
        {active ? (
          filters.direction === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : null}
      </button>
    );
  }
  return (
    <div className="um-root mx-auto w-full max-w-7xl space-y-4">
      <style>{ANIMATION_CSS}</style>

      <div className="flex items-center justify-between">
        <div
          style={stagger(0)}
          className="um-fade-up flex items-center gap-2 text-sm text-slate-500 dark:text-[#a7b4c7]"
        >
          <ReceiptText className="h-4 w-4" /> Tagihan
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setFormOpen(true);
          }}
          style={stagger(1, 0, 80)}
          className="um-btn um-fade-up inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" /> Tambah Tagihan
        </button>
      </div>
      {error && (
        <div
          role="alert"
          className="um-alert rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="um-alert rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {notice}
        </div>
      )}
      {formOpen && (
        <section className="um-fade-up rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">
              {editId ? "Edit Tagihan" : "Tambah Tagihan"}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              aria-label="Tutup"
              className="um-btn rounded-md p-1 hover:bg-slate-100 dark:hover:bg-[#1b2a3d]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {!editId && (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                <input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Cari nama atau NIS siswa"
                  className={inputClass}
                />
                <select
                  value={studentMajor}
                  onChange={(event) => {
                    setStudentMajor(event.target.value);
                    setStudentClass("");
                  }}
                  className={inputClass}
                >
                  <option value="">Semua jurusan</option>
                  {majors.map((major) => (
                    <option key={major.id} value={major.id}>
                      {major.nama}
                    </option>
                  ))}
                </select>
                <select
                  value={studentLevel}
                  onChange={(event) => {
                    setStudentLevel(event.target.value);
                    setStudentClass("");
                  }}
                  className={inputClass}
                >
                  <option value="">Semua tingkat</option>
                  {["X", "XI", "XII"].map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
                <select
                  value={studentClass}
                  onChange={(event) => setStudentClass(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Semua kelas</option>
                  {classes
                    .filter(
                      (item) =>
                        (!studentMajor || item.jurusanId === studentMajor) &&
                        (!studentLevel || item.level === studentLevel),
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            {!editId && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedStudents(
                      filteredStudents.map((student) => student.id),
                    )
                  }
                  className="um-btn rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1b2a3d]"
                >
                  Pilih Semua Hasil Filter
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudents([])}
                  className="um-btn rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#1b2a3d]"
                >
                  Hapus Pilihan
                </button>
                <span className="text-slate-500 dark:text-[#a7b4c7]">
                  {selectedStudents.length} siswa terpilih
                </span>
              </div>
            )}
            {!editId && (
              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-[#263449] p-2">
                {filteredStudents.map((student) => (
                  <label
                    key={student.id}
                    className="um-row flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-[#1b2a3d]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                    />
                    {student.name} - {student.nis} -{" "}
                    {student.Class?.name || "-"}
                  </label>
                ))}
                {filteredStudents.length === 0 && (
                  <p className="p-2 text-sm text-slate-500 dark:text-[#a7b4c7]">
                    Siswa aktif tidak ditemukan.
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
              <select
                value={itemId}
                onChange={(event) => selectItem(event.target.value)}
                className={inputClass}
              >
                <option value="">Pilih barang</option>
                {items
                  .filter((item) => item.status !== "Nonaktif")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {formatRupiah(item.price)}
                    </option>
                  ))}
              </select>
              <div>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Nominal"
                  className={inputClass}
                />
                {selectedItem && Number(amount) !== selectedItem.price && (
                  <span className="um-fade-in text-xs text-amber-600">
                    Nominal manual
                  </span>
                )}
              </div>
              <label className="text-xs font-medium text-slate-500 dark:text-[#a7b4c7]">
                Tanggal Tagihan
                <input
                  type="date"
                  value={billDate}
                  onChange={(event) => setBillDate(event.target.value)}
                  className={`mt-1 ${dateInputClass}`}
                />
              </label>
              <label className="text-xs font-medium text-slate-500 dark:text-[#a7b4c7]">
                Tanggal Jatuh Tempo
                <input
                  type="date"
                  min={billDate || undefined}
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className={`mt-1 ${dateInputClass}`}
                />
              </label>
            </div>
            {!editId && selectedStudents.length > 0 && (
              <p className="um-fade-in text-sm text-slate-500 dark:text-[#a7b4c7]">
                {selectedStudents.length} siswa x{" "}
                {formatRupiah(Number(amount || 0))} ={" "}
                <strong>{formatRupiah(studentSelectionTotal)}</strong>
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="um-btn inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {saving && <span className="um-spinner" aria-hidden="true" />}
                {saving
                  ? "Menyimpan..."
                  : editId
                    ? "Simpan Perubahan"
                    : "Simpan Tagihan"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="um-btn rounded-lg border border-slate-200 dark:border-[#263449] px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-[#1b2a3d]"
              >
                Batal
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/* Filter (didesain ulang: semua kolom punya label & kelompok)   */}
      {/* ------------------------------------------------------------ */}
      <section
        style={stagger(2, 0, 80)}
        className="um-fade-up space-y-4 rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-4"
      >
        {/* Judul + reset */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#102a43] dark:text-slate-100">
            <SlidersHorizontal className="h-4 w-4 text-teal-600 dark:text-teal-300" />
            Filter Tagihan
          </h2>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="um-btn um-fade-in inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <X className="h-3.5 w-3.5" /> Reset Semua Filter
            </button>
          )}
        </div>

        {/* Baris utama: pencarian, status, keterlambatan */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <Field label="Pencarian">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-500 dark:text-blue-300" />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Cari siswa, NIS, atau barang"
                className={`${inputClass} pl-9`}
              />
            </div>
          </Field>

          <div>
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-[#a7b4c7]">
              Status pembayaran
            </span>
            <div
              role="group"
              aria-label="Status pembayaran"
              className="inline-flex w-full gap-1 rounded-lg border border-slate-200 p-1 dark:border-[#263449] lg:w-auto"
            >
              {["", "Belum Bayar", "Lunas"].map((status) => (
                <button
                  key={status || "semua"}
                  type="button"
                  aria-pressed={filters.status === status}
                  onClick={() => updateFilters({ status })}
                  className={`um-btn flex-1 rounded-md px-3 py-1.5 text-sm ${filters.status === status ? "bg-teal-600 text-white" : "hover:bg-slate-100 dark:hover:bg-[#1b2a3d]"}`}
                >
                  {status || "Semua"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-[#a7b4c7]">
              Jatuh tempo
            </span>
            <button
              type="button"
              aria-pressed={filters.overdue}
              onClick={() => updateFilters({ overdue: !filters.overdue })}
              className={`um-btn w-full rounded-lg px-3 py-2 text-sm lg:w-auto ${filters.overdue ? "bg-amber-500 text-white" : "border border-slate-200 hover:bg-slate-50 dark:border-[#263449] dark:hover:bg-[#1b2a3d]"}`}
            >
              Hanya yang terlambat
            </button>
          </div>
        </div>

        {/* Chip filter aktif */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-[#a7b4c7]">
              Filter aktif:
            </span>
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  if (chip.key === "search") setSearchDraft("");
                  updateFilters({
                    [chip.key]: defaults[chip.key],
                  } as Partial<FilterState>);
                }}
                className="um-badge um-fade-in inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {/* Kelompok filter */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <FilterGroup
            className="lg:col-span-2"
            title="Data Siswa"
            description="Persempit tagihan berdasarkan jurusan, tingkat, kelas, atau angkatan siswa."
            action={
              <button
                type="button"
                onClick={() =>
                  updateFilters({ jurusan: "", level: "", classId: "" })
                }
                title="Kosongkan pilihan jurusan, tingkat, dan kelas"
                className="um-btn shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-50 dark:border-[#263449] dark:hover:bg-[#1b2a3d]"
              >
                Reset Jurusan-Kelas
              </button>
            }
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Jurusan">
                <select
                  value={filters.jurusan}
                  onChange={(event) =>
                    updateFilters({ jurusan: event.target.value, classId: "" })
                  }
                  className={inputClass}
                >
                  <option value="">Semua jurusan</option>
                  {majors.map((major) => (
                    <option key={major.id} value={major.id}>
                      {major.nama}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tingkat">
                <select
                  value={filters.level}
                  onChange={(event) =>
                    updateFilters({ level: event.target.value, classId: "" })
                  }
                  className={inputClass}
                >
                  <option value="">Semua tingkat</option>
                  {["X", "XI", "XII"].map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </Field>
              <Field label="Kelas">
                <select
                  value={filters.classId}
                  onChange={(event) =>
                    updateFilters({ classId: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Semua kelas</option>
                  {availableClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Angkatan">
                <select
                  value={filters.generation}
                  onChange={(event) =>
                    updateFilters({ generation: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Semua angkatan</option>
                  {generations.map((generation) => (
                    <option key={generation}>{generation}</option>
                  ))}
                </select>
              </Field>
            </div>
          </FilterGroup>

          <FilterGroup
            className="lg:col-span-2"
            title="Barang dan Nominal"
            description="Pilih barang tertentu atau batasi rentang nominal tagihan (dalam rupiah)."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Barang">
                <select
                  value={filters.itemId}
                  onChange={(event) =>
                    updateFilters({ itemId: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Semua barang</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nominal minimum">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-2 text-sm text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={filters.min}
                    onChange={(event) =>
                      updateFilters({ min: event.target.value })
                    }
                    placeholder="0"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Nominal maksimum">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-2 text-sm text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={filters.max}
                    onChange={(event) =>
                      updateFilters({ max: event.target.value })
                    }
                    placeholder="Tanpa batas"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>
            </div>
          </FilterGroup>

          <FilterGroup
            title="Tanggal Tagihan"
            description="Tanggal tagihan dibuat atau diterbitkan."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Dari tanggal">
                <input
                  type="date"
                  value={filters.billFrom}
                  max={filters.billTo || undefined}
                  onChange={(event) =>
                    updateFilters({ billFrom: event.target.value })
                  }
                  className={dateInputClass}
                />
              </Field>
              <Field label="Sampai tanggal">
                <input
                  type="date"
                  value={filters.billTo}
                  min={filters.billFrom || undefined}
                  onChange={(event) =>
                    updateFilters({ billTo: event.target.value })
                  }
                  className={dateInputClass}
                />
              </Field>
            </div>
          </FilterGroup>

          <FilterGroup
            title="Tanggal Jatuh Tempo"
            description="Batas waktu pembayaran tagihan."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Dari tanggal">
                <input
                  type="date"
                  value={filters.dueFrom}
                  max={filters.dueTo || undefined}
                  onChange={(event) =>
                    updateFilters({ dueFrom: event.target.value })
                  }
                  className={dateInputClass}
                />
              </Field>
              <Field label="Sampai tanggal">
                <input
                  type="date"
                  value={filters.dueTo}
                  min={filters.dueFrom || undefined}
                  onChange={(event) =>
                    updateFilters({ dueTo: event.target.value })
                  }
                  className={dateInputClass}
                />
              </Field>
            </div>
          </FilterGroup>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["Total Tagihan", filteredBills.length],
          [
            "Lunas",
            filteredBills.filter((bill) => bill.status === "Lunas").length,
          ],
          [
            "Belum Bayar",
            filteredBills.filter((bill) => bill.status !== "Lunas").length,
          ],
        ].map(([label, value], index) => (
          <div
            key={String(label)}
            style={stagger(index, 200, 80)}
            className="um-card um-fade-up rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-3"
          >
            <p className="text-xs text-slate-500 dark:text-[#a7b4c7]">
              {label}
            </p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <section
        style={stagger(0, 460)}
        className="um-fade-up overflow-hidden rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#263449] px-4 py-3 text-sm">
          <span>
            Menampilkan{" "}
            {visibleBills.length
              ? (filters.page - 1) * filters.pageSize + 1
              : 0}
            -{Math.min(filters.page * filters.pageSize, filteredBills.length)}{" "}
            dari {filteredBills.length} tagihan
          </span>
          <label className="flex items-center gap-2">
            Per halaman
            <select
              value={filters.pageSize}
              onChange={(event) =>
                updateFilters(
                  { pageSize: Number(event.target.value), page: 1 },
                  false,
                )
              }
              className="um-input rounded border border-slate-200 dark:border-[#263449] px-2 py-1 outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
        <div className="max-h-[55vh] overflow-auto">
          <table className="w-full min-w-215 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#1b2a3d] text-xs text-slate-500 dark:text-[#a7b4c7]">
              <tr>
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">
                  <SortHeader label="Siswa" sort="student" />
                </th>
                <th className="px-3 py-2">
                  <SortHeader label="Barang" sort="item" />
                </th>
                <th className="px-3 py-2">
                  <SortHeader label="Nominal" sort="amount" />
                </th>
                <th className="px-3 py-2">
                  <SortHeader label="Status" sort="status" />
                </th>
                <th className="px-3 py-2">
                  <SortHeader label="Tanggal Tagihan" sort="billDate" />
                </th>
                <th className="px-3 py-2">Jatuh Tempo</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#263449]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <span className="um-fade-in inline-flex items-center gap-2">
                      <span
                        className="um-spinner text-teal-600 dark:text-teal-300"
                        aria-hidden="true"
                      />
                      <span className="um-pulse">Memuat data...</span>
                    </span>
                  </td>
                </tr>
              ) : (
                visibleBills.map((bill, index) => (
                  <tr
                    key={bill.id}
                    style={stagger(index, 0, 40)}
                    className="um-row um-row-in hover:bg-slate-50 dark:hover:bg-[#1b2a3d]"
                  >
                    <td className="px-3 py-2">
                      {(filters.page - 1) * filters.pageSize + index + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">
                        {bill.Student?.name || "-"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-[#a7b4c7]">
                        {bill.Student?.nis || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2">{bill.Item?.name || "-"}</td>
                    <td className="px-3 py-2 font-medium">
                      {formatRupiah(bill.amount)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`um-badge inline-block rounded-full px-2 py-1 text-xs font-semibold ${bill.status === "Lunas" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {bill.billDate
                        ? formatDate(bill.billDate)
                        : "Belum diatur"}
                    </td>
                    <td className="px-3 py-2">
                      {bill.dueDate ? formatDate(bill.dueDate) : "Belum diatur"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(bill)}
                          aria-label={`Edit tagihan ${bill.Student?.name || ""}`}
                          title="Edit tagihan"
                          className="um-btn inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(bill);
                              setDeleteError("");
                            }}
                            aria-label={`Hapus tagihan ${bill.Student?.name || ""}`}
                            title="Hapus tagihan"
                            className="um-btn inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && visibleBills.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-slate-500 dark:text-[#a7b4c7]"
                  >
                    <span className="um-fade-in inline-block">
                      Tidak ada hasil tagihan.
                      {hasFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="um-btn ml-2 rounded px-1 text-teal-600 underline"
                        >
                          Reset filter
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-[#263449] px-4 py-3 text-sm">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() => updateFilters({ page: filters.page - 1 }, false)}
            aria-label="Halaman sebelumnya"
            className="um-btn rounded border border-slate-200 dark:border-[#263449] p-1 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>
            Halaman {filters.page} dari {totalPages}
          </span>
          <button
            type="button"
            disabled={filters.page >= totalPages}
            onClick={() => updateFilters({ page: filters.page + 1 }, false)}
            aria-label="Halaman berikutnya"
            className="um-btn rounded border border-slate-200 dark:border-[#263449] p-1 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
      {canDelete && (
        <ConfirmModal
          open={Boolean(deleteTarget)}
          title="Hapus Tagihan?"
          description="Data tagihan yang dipilih akan dihapus. Tindakan ini tidak dapat dibatalkan."
          loading={deleteLoading}
          error={deleteError}
          onCancel={() => {
            if (!deleteLoading) setDeleteTarget(null);
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}
export default Bill;