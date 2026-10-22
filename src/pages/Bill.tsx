import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
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
const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;
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

function Bill() {
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
        className="inline-flex cursor-pointer items-center gap-1 font-semibold"
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
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-[#a7b4c7]">
          <ReceiptText className="h-4 w-4" /> Tagihan
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Tambah Tagihan
        </button>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {notice}
        </div>
      )}
      {formOpen && (
        <section className="rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">
              {editId ? "Edit Tagihan" : "Tambah Tagihan"}
            </h2>
            <button type="button" onClick={resetForm} aria-label="Tutup">
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
                  className="rounded-lg border border-slate-200 dark:border-[#263449]px-3 py-2 text-sm"
                />
                <select
                  value={studentMajor}
                  onChange={(event) => {
                    setStudentMajor(event.target.value);
                    setStudentClass("");
                  }}
                  className="rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-2 text-sm"
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
                  className="rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-2 text-sm"
                >
                  <option value="">Semua tingkat</option>
                  {["X", "XI", "XII"].map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
                <select
                  value={studentClass}
                  onChange={(event) => setStudentClass(event.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-2 text-sm"
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
                  className="rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-1.5"
                >
                  Pilih Semua Hasil Filter
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudents([])}
                  className="rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-1.5"
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
                    className="flex items-center gap-2 px-2 py-1 text-sm"
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
                className="rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-2 text-sm"
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
                  className="w-full rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-2 text-sm"
                />
                {selectedItem && Number(amount) !== selectedItem.price && (
                  <span className="text-xs text-amber-600">Nominal manual</span>
                )}
              </div>
              <label className="text-xs font-medium text-slate-500 dark:text-[#a7b4c7]">
                Tanggal Tagihan
                <input
                  type="date"
                  value={billDate}
                  onChange={(event) => setBillDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-2 text-sm text-[#102a43] dark:text-slate-100"
                />
              </label>
              <label className="text-xs font-medium text-slate-500 dark:text-[#a7b4c7]">
                Tanggal Jatuh Tempo
                <input
                  type="date"
                  min={billDate || undefined}
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-[#263449] px-3 py-2 text-sm text-[#102a43] dark:text-slate-100"
                />
              </label>
            </div>
            {!editId && selectedStudents.length > 0 && (
              <p className="text-sm text-slate-500 dark:text-[#a7b4c7]">
                {selectedStudents.length} siswa x{" "}
                {formatRupiah(Number(amount || 0))} ={" "}
                <strong>{formatRupiah(studentSelectionTotal)}</strong>
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? "Menyimpan..."
                  : editId
                    ? "Simpan Perubahan"
                    : "Simpan Tagihan"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-200 dark:border-[#263449] px-4 py-2 text-sm"
              >
                Batal
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Cari siswa, NIS, atau barang"
              className="w-full rounded-lg border border-slate-200 dark:border-[#263449] py-2 pl-9 pr-3 text-sm"
            />
          </div>
          {["", "Belum Bayar", "Lunas"].map((status) => (
            <button
              key={status || "semua"}
              type="button"
              onClick={() => updateFilters({ status })}
              className={`rounded-lg px-3 py-2 text-sm ${filters.status === status ? "bg-teal-600 text-white" : "border border-slate-200 dark:border-[#263449]"}`}
            >
              {status || "Semua"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => updateFilters({ overdue: !filters.overdue })}
            className={`rounded-lg px-3 py-2 text-sm ${filters.overdue ? "bg-amber-500 text-white" : "border border-slate-200 dark:border-[#263449]"}`}
          >
            Terlambat
          </button>
          <button
            type="button"
            onClick={() =>
              updateFilters({ jurusan: "", level: "", classId: "" })
            }
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-[#263449]px-3 py-2 text-sm"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filter
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg px-3 py-2 text-sm text-red-600"
            >
              Reset Filter
            </button>
          )}
        </div>
        {activeFilterChips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
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
                className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs text-teal-700"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-6">
          <select
            value={filters.jurusan}
            onChange={(event) =>
              updateFilters({ jurusan: event.target.value, classId: "" })
            }
            className="rounded border border-slate-200 dark:border-[#263449] px-2 py-1.5 text-xs"
          >
            <option value="">Jurusan</option>
            {majors.map((major) => (
              <option key={major.id} value={major.id}>
                {major.nama}
              </option>
            ))}
          </select>
          <select
            value={filters.level}
            onChange={(event) =>
              updateFilters({ level: event.target.value, classId: "" })
            }
            className="rounded border border-slate-200 dark:border-[#263449] px-2 py-1.5 text-xs"
          >
            <option value="">Tingkat</option>
            {["X", "XI", "XII"].map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
          <select
            value={filters.classId}
            onChange={(event) => updateFilters({ classId: event.target.value })}
            className="rounded border border-slate-200 dark:border-[#263449] px-2 py-1.5 text-xs"
          >
            <option value="">Kelas</option>
            {availableClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={filters.generation}
            onChange={(event) =>
              updateFilters({ generation: event.target.value })
            }
            className="rounded border border-slate-200 dark:border-[#263449] px-2 py-1.5 text-xs"
          >
            <option value="">Angkatan</option>
            {generations.map((generation) => (
              <option key={generation}>{generation}</option>
            ))}
          </select>
          <select
            value={filters.itemId}
            onChange={(event) => updateFilters({ itemId: event.target.value })}
            className="rounded border border-slate-200 dark:border-[#263449] px-2 py-1.5 text-xs"
          >
            <option value="">Barang</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            <input
              type="number"
              value={filters.min}
              onChange={(event) => updateFilters({ min: event.target.value })}
              placeholder="Min"
              className="w-1/2 rounded border border-slate-200 dark:border-[#263449] px-2 py-1.5 text-xs"
            />
            <input
              type="number"
              value={filters.max}
              onChange={(event) => updateFilters({ max: event.target.value })}
              placeholder="Maks"
              className="w-1/2 rounded border border-slate-200 dark:border-[#263449] px-2 py-1.5 text-xs"
            />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <fieldset className="rounded-lg border border-slate-200 dark:border-[#263449] p-2">
            <legend className="px-1 text-xs font-semibold">
              Tanggal Tagihan
            </legend>
            <p className="mb-2 text-[11px] text-slate-500 dark:text-[#a7b4c7]">
              Cari berdasarkan tanggal tagihan dibuat atau diterbitkan.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-xs text-slate-500 dark:text-[#a7b4c7]">
                Dari tanggal
                <input
                  type="date"
                  value={filters.billFrom}
                  onChange={(event) =>
                    updateFilters({ billFrom: event.target.value })
                  }
                  className="mt-1 w-full rounded border border-slate-200 dark:border-[#263449] px-2 py-1.5 text-xs text-[#102a43] dark:text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-500 dark:text-[#a7b4c7]">
                Sampai tanggal
                <input
                  type="date"
                  value={filters.billTo}
                  onChange={(event) =>
                    updateFilters({ billTo: event.target.value })
                  }
                  className="mt-1 w-full rounded border border-slate-200 dark:border-[#263449] px-2 py-1.5 text-xs text-[#102a43] dark:text-slate-100"
                />
              </label>
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-slate-200 dark:border-[#263449] p-2">
            <legend className="px-1 text-xs font-semibold">
              Tanggal Jatuh Tempo
            </legend>
            <p className="mb-2 text-[11px] text-slate-500 dark:text-[#a7b4c7]">
              Cari berdasarkan batas waktu pembayaran tagihan.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-xs text-slate-500 dark:text-[#a7b4c7]">
                Dari tanggal
                <input
                  type="date"
                  value={filters.dueFrom}
                  onChange={(event) =>
                    updateFilters({ dueFrom: event.target.value })
                  }
                  className="mt-1 w-full rounded border border-slate-200 dark:border-[#263449] px-2 py-1.5 text-xs text-[#102a43] dark:text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-500 dark:text-[#a7b4c7]">
                Sampai tanggal
                <input
                  type="date"
                  value={filters.dueTo}
                  onChange={(event) =>
                    updateFilters({ dueTo: event.target.value })
                  }
                  className="mt-1 w-full rounded border border-slate-200 dark:border-[#263449] px-2 py-1.5 text-xs text-[#102a43] dark:text-slate-100"
                />
              </label>
            </div>
          </fieldset>
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
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e] p-3"
          >
            <p className="text-xs text-slate-500 dark:text-[#a7b4c7]">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#263449] bg-white dark:bg-[#111c2e]">
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
              className="rounded border border-slate-200 dark:border-[#263449] px-2 py-1"
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
                    Memuat data...
                  </td>
                </tr>
              ) : (
                visibleBills.map((bill, index) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#1b2a3d]"
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
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${bill.status === "Lunas" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {dateValue(bill.billDate) || "Belum diatur"}
                    </td>
                    <td className="px-3 py-2">
                      {dateValue(bill.dueDate) || "Belum diatur"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => startEdit(bill)}
                        className="mr-2 text-blue-600"
                      >
                        <Edit3 className="inline h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(bill);
                          setDeleteError("");
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="inline h-4 w-4" />
                      </button>
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
                    Tidak ada hasil tagihan.
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="ml-2 text-teal-600 underline"
                      >
                        Reset filter
                      </button>
                    )}
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
            className="rounded border border-slate-200 dark:border-[#263449] p-1 disabled:opacity-40"
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
            className="rounded border border-slate-200 dark:border-[#263449] p-1 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
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
    </div>
  );
}
export default Bill;
