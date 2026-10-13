import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ChevronLeft, ChevronRight, Edit3, Plus, Search, SlidersHorizontal,
  Trash2, X, School,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import {
  classFiltersToParams, DEFAULT_CLASS_FILTERS, normaliseClassFilters,
  toggleClassSort, type ClassFilterState, type ClassSortKey,
} from "../utils/classFilters";

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
  jurusanIds?: string[];
  Jurusan?: Major;
  academicYear: string;
  status: string;
  studentCount: number;
}

const levels = ["X", "XI", "XII"];
const statuses = ["Aktif", "Akan datang", "Nonaktif", "Lulus/Arsip"];
const START_YEAR = 2013;
const currentYear = new Date().getFullYear();

function yearsFrom(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => String(end - index));
}

function parseAcademicYear(value: string) {
  const match = value.match(/^(\d{4})\/(\d{4})$/);
  return match ? { start: match[1], end: match[2] } : null;
}

function splitLegacyName(name: string) {
  const match = name.match(/^(XII|XI|X)\s+(\S+)\s+(\d+)$/);
  return match ? { level: match[1], number: match[3] } : { level: "", number: "" };
}

function Kelas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [filters, setFilters] = useState<ClassFilterState>(() => normaliseClassFilters(searchParams));
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [autoName, setAutoName] = useState(true);
  const [form, setForm] = useState({
    name: "", level: "X", jurusanId: "", classNumber: "",
    startYear: String(currentYear), endYear: String(currentYear + 3),
    status: "Aktif",
  });

  function updateFilters(patch: Partial<ClassFilterState>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    setSearchParams(classFiltersToParams(next), { replace: true });
  }

  useEffect(() => {
    const next = normaliseClassFilters(searchParams);
    setFilters(next);
    setSearchDraft(next.search);
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = { ...normaliseClassFilters(searchParams), search: searchDraft, page: 1 };
      setFilters(next);
      setSearchParams(classFiltersToParams(next), { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft, searchParams]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [classResponse, majorResponse] = await Promise.all([
        api.get<ClassData[]>("/classes"),
        api.get<Major[]>("/jurusan"),
      ]);
      setClasses(classResponse.data);
      setMajors(majorResponse.data);
    } catch {
      setError("Data kelas atau jurusan gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return classes
      .filter((item) => {
        const startYear = parseAcademicYear(item.academicYear)?.start;
        return (!filters.level || item.level === filters.level) &&
          (!query || item.name.toLowerCase().includes(query)) &&
          (!filters.jurusanId || item.jurusanId === filters.jurusanId || item.jurusanIds?.includes(filters.jurusanId)) &&
          (!filters.startYear || startYear === filters.startYear) &&
          (!filters.status || item.status === filters.status) &&
          (!filters.occupancy ||
            (filters.occupancy === "empty" ? item.studentCount === 0 : item.studentCount > 0));
      })
      .sort((a, b) => {
        const left = filters.sort === "studentCount" ? a.studentCount :
          filters.sort === "level" ? a.level : filters.sort === "academicYear" ? a.academicYear : a.name;
        const right = filters.sort === "studentCount" ? b.studentCount :
          filters.sort === "level" ? b.level : filters.sort === "academicYear" ? b.academicYear : b.name;
        const comparison = typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), "id", { numeric: true });
        return comparison * (filters.direction === "asc" ? 1 : -1);
      });
  }, [classes, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / filters.pageSize));
  const currentPage = Math.min(filters.page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * filters.pageSize, currentPage * filters.pageSize);
  const startYears = useMemo(() => {
    const values = classes.map((item) => parseAcademicYear(item.academicYear)?.start).filter(Boolean) as string[];
    return [...new Set(values)].sort((a, b) => Number(b) - Number(a));
  }, [classes]);
  const invalidYearClasses = classes.filter((item) => {
    const years = parseAcademicYear(item.academicYear);
    return !years || Number(years.end) <= Number(years.start);
  });
  const selectedMajor = majors.find((item) => item.id === form.jurusanId);
  const generatedName = form.level && selectedMajor && form.classNumber
    ? `${form.level} ${selectedMajor.kode} ${form.classNumber}`
    : "";
  const unassignedClasses = classes.filter((item) => !item.jurusanId);

  function setFormValue<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditId(null);
    setAutoName(true);
    setForm({
      name: "", level: "X", jurusanId: "", classNumber: "",
      startYear: String(currentYear), endYear: String(currentYear + 3), status: "Aktif",
    });
    setFormOpen(false);
  }

  function openCreate() {
    resetForm();
    setFormOpen(true);
  }

  function startEdit(item: ClassData) {
    const nameParts = splitLegacyName(item.name);
    const years = parseAcademicYear(item.academicYear);
    setEditId(item.id);
    setAutoName(false);
    setForm({
      name: item.name,
      level: nameParts.level || item.level,
      jurusanId: item.jurusanId || "",
      classNumber: nameParts.number,
      startYear: years?.start || String(currentYear),
      endYear: years?.end || String(currentYear + 3),
      status: statuses.includes(item.status) ? item.status : "Aktif",
    });
    setFormOpen(true);
  }

  function handleStartYear(value: string) {
    setForm((current) => ({ ...current, startYear: value, endYear: String(Number(value) + 3) }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const name = autoName ? generatedName : form.name.trim();
    if (!form.level || !form.jurusanId || !form.classNumber || !name) {
      setError("Tingkat, jurusan, nomor kelas, dan nama kelas wajib diisi.");
      return;
    }
    if (!/^[1-9]\d*$/.test(form.classNumber)) {
      setError("Nomor kelas harus berupa angka positif.");
      return;
    }
    if (Number(form.endYear) <= Number(form.startYear)) {
      setError("Tahun selesai harus lebih besar daripada tahun masuk.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name,
        level: form.level,
        jurusanId: form.jurusanId,
        academicYear: `${form.startYear}/${form.endYear}`,
        status: form.status,
      };
      if (editId) await api.put(`/classes/${editId}`, payload);
      else await api.post("/classes", payload);
      setNotice(editId ? "Kelas berhasil diperbarui." : "Kelas berhasil ditambahkan.");
      resetForm();
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Gagal menyimpan data kelas.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: ClassData) {
    if (!window.confirm(`Hapus ${item.name}?`)) return;
    try {
      await api.delete(`/classes/${item.id}`);
      setNotice("Kelas berhasil dihapus.");
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Kelas tidak dapat dihapus.");
    }
  }

  function resetFilters() {
    setSearchDraft("");
    setFilters(DEFAULT_CLASS_FILTERS);
    setSearchParams(classFiltersToParams(DEFAULT_CLASS_FILTERS), { replace: true });
  }

  function removeFilter(key: keyof Pick<ClassFilterState, "level" | "jurusanId" | "startYear" | "status" | "occupancy">) {
    updateFilters({ [key]: "", page: 1 });
  }

  function sortBy(sort: ClassSortKey) {
    updateFilters({ ...toggleClassSort(filters, sort), page: 1 });
  }

  const chips = [
    ["level", filters.level],
    ["jurusanId", majors.find((item) => item.id === filters.jurusanId)?.nama],
    ["startYear", filters.startYear],
    ["status", filters.status],
    ["occupancy", filters.occupancy === "empty" ? "Kosong" : filters.occupancy === "hasStudents" ? "Ada siswa" : ""],
  ] as const;

  return (
    <div>
      <PageHeader className="mb-4" title="Kelas" description="Kelola rombongan belajar sekolah" icon={School} />
      {error && <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{notice}</div>}
      {invalidYearClasses.length > 0 && <div role="status" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{invalidYearClasses.length} kelas memiliki format tahun ajaran lama yang tidak konsisten. Data tidak diubah otomatis.</div>}
      {unassignedClasses.length > 0 && <div role="status" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{unassignedClasses.length} kelas lama belum memiliki Jurusan langsung. Relasi dari siswa lama tetap dipertahankan; pilih Jurusan saat mengedit untuk melengkapinya.</div>}

      <div className="mb-4 flex justify-end">
        <button type="button" onClick={formOpen ? resetForm : openCreate} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
          {formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {formOpen ? "Tutup Form" : "Tambah Kelas"}
        </button>
      </div>

      {formOpen && <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">{editId ? "Edit Kelas" : "Tambah Kelas"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            <select required value={form.level} onChange={(event) => setFormValue("level", event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Pilih tingkat</option>{levels.map((level) => <option key={level}>{level}</option>)}</select>
            <select required value={form.jurusanId} onChange={(event) => setFormValue("jurusanId", event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Pilih jurusan</option>{majors.map((major) => <option key={major.id} value={major.id}>{major.nama} ({major.kode})</option>)}</select>
            <input required type="number" min="1" step="1" placeholder="Nomor kelas" value={form.classNumber} onChange={(event) => setFormValue("classNumber", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <select required value={form.startYear} onChange={(event) => handleStartYear(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Tahun masuk</option>{yearsFrom(START_YEAR, currentYear + 1).map((year) => <option key={year}>{year}</option>)}</select>
            <select required value={form.endYear} onChange={(event) => setFormValue("endYear", event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Tahun selesai</option>{yearsFrom(START_YEAR + 1, currentYear + 8).map((year) => <option key={year}>{year}</option>)}</select>
            <select required value={form.status} onChange={(event) => setFormValue("status", event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">{statuses.map((status) => <option key={status}>{status}</option>)}</select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {editId && <label className="inline-flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={autoName} onChange={(event) => setAutoName(event.target.checked)} /> Perbarui nama otomatis</label>}
            <span className="text-sm text-gray-600">Preview: <strong className="text-gray-900">{generatedName || form.name || "Lengkapi identitas kelas"}</strong></span>
            <div className="ml-auto flex gap-2"><button disabled={saving} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah"}</button>{editId && <button type="button" onClick={resetForm} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">Batal</button>}</div>
          </div>
        </form>
      </div>}

      <div className="min-w-0 rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-lg font-semibold text-gray-900">Daftar Kelas</h2><p className="text-xs text-gray-500">Kelola kelas, status, dan kapasitas siswa.</p></div>
            <div className="relative w-full lg:max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input aria-label="Cari nama kelas" placeholder="Cari nama kelas..." value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm" /></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
            {["", ...levels].map((level) => <button key={level || "all"} onClick={() => updateFilters({ level, page: 1 })} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filters.level === level ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600"}`}>{level || "Semua"}</button>)}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <select value={filters.jurusanId} onChange={(event) => updateFilters({ jurusanId: event.target.value, page: 1 })} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Semua jurusan</option>{majors.map((major) => <option key={major.id} value={major.id}>{major.nama}</option>)}</select>
            <select value={filters.startYear} onChange={(event) => updateFilters({ startYear: event.target.value, page: 1 })} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Semua tahun masuk</option>{startYears.map((year) => <option key={year}>{year}</option>)}</select>
            <select value={filters.status} onChange={(event) => updateFilters({ status: event.target.value, page: 1 })} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Semua status</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
            <select value={filters.occupancy} onChange={(event) => updateFilters({ occupancy: event.target.value, page: 1 })} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">Semua jumlah siswa</option><option value="empty">Kosong</option><option value="hasStudents">Ada siswa</option></select>
            <button type="button" onClick={resetFilters} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"><SlidersHorizontal className="h-4 w-4" /> Reset Filter</button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm"><span className="text-gray-500">Menampilkan {filtered.length ? (currentPage - 1) * filters.pageSize + 1 : 0}-{Math.min(currentPage * filters.pageSize, filtered.length)} dari {filtered.length} kelas</span>{chips.map(([key, label]) => label && <button key={key} onClick={() => removeFilter(key)} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">{label}<X className="h-3 w-3" /></button>)}</div>
        </div>
        <div className="overflow-x-auto">
          {loading ? <div className="p-10 text-center text-sm text-gray-500">Memuat data kelas...</div> : <table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">No</th>{([["name", "Nama Kelas"], ["level", "Tingkat"], ["academicYear", "Tahun Ajaran"], ["studentCount", "Jumlah Siswa"]] as const).map(([key, label]) => <th key={key} className="px-4 py-3"><button onClick={() => sortBy(key)} className="inline-flex items-center gap-1">{label}<span className="text-teal-600">{filters.sort === key ? filters.direction === "asc" ? "↑" : "↓" : "↕"}</span></button></th>)}<th className="px-4 py-3">Jurusan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-gray-200">{pageItems.map((item, index) => <tr key={item.id} className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-500">{(currentPage - 1) * filters.pageSize + index + 1}</td><td className="px-4 py-3 font-medium text-gray-900">{item.name}</td><td className="px-4 py-3 text-gray-600">{item.level}</td><td className="px-4 py-3 text-gray-600">{item.academicYear}</td><td className="px-4 py-3 text-gray-600">{item.studentCount}</td><td className="px-4 py-3 text-gray-600">{item.Jurusan?.kode || (item.jurusanIds?.length ? `${item.jurusanIds.length} relasi lama` : "Belum ditentukan")}</td><td className="px-4 py-3"><span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">{item.status}</span></td><td className="px-4 py-3"><div className="flex gap-2"><button title="Edit kelas" onClick={() => startEdit(item)} className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"><Edit3 className="h-4 w-4" /></button><button title="Hapus kelas" onClick={() => handleDelete(item)} className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}{!pageItems.length && <tr><td colSpan={8} className="p-10 text-center text-gray-500"><p>{filtered.length ? "Halaman ini tidak memiliki data." : "Tidak ada kelas yang cocok dengan filter."}</p><button onClick={resetFilters} className="mt-3 font-medium text-teal-600">Reset Filter</button></td></tr>}</tbody></table>}
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3"><select value={filters.pageSize} onChange={(event) => updateFilters({ pageSize: Number(event.target.value), page: 1 })} className="rounded border border-gray-300 px-2 py-1 text-sm"><option value={10}>10 / halaman</option><option value={25}>25 / halaman</option><option value={50}>50 / halaman</option></select><div className="flex items-center gap-2 text-sm"><button disabled={currentPage <= 1} onClick={() => updateFilters({ page: currentPage - 1 })} className="rounded border p-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><span>Halaman {currentPage} dari {pageCount}</span><button disabled={currentPage >= pageCount} onClick={() => updateFilters({ page: currentPage + 1 })} className="rounded border p-1 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></div>
      </div>
    </div>
  );
}

export default Kelas;
